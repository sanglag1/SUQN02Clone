import { NextRequest, NextResponse } from 'next/server';
import PDFParser from 'pdf2json';
import { JDValidationService } from '@/services/jdValidationService';
import { prisma } from '@/lib/prisma';

// Route segment config for Next.js 13+ App Router
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Validate request size (10MB limit on Vercel)
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Get file as ArrayBuffer
    const arrayBuffer = await req.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return NextResponse.json({ error: 'Uploaded file is empty.' }, { status: 400 });
    }    let text = '';
    try {      // Create new instance of PDFParser
      const pdfParser = new PDFParser();

      // Create a promise to handle the parsing
      const parseResult = await new Promise<string>((resolve, reject) => {        pdfParser.on('pdfParser_dataReady', (pdfData) => {
          try {
            // Convert PDF data to text
            const raw = pdfData.Pages.map(page => 
              page.Texts.map(text => 
                decodeURIComponent(text.R.map(r => r.T).join(' '))
              ).join(' ')
            ).join('\n');
            
            resolve(raw);          } catch {
            reject(new Error('Failed to process PDF content'));
          }
        });

        pdfParser.on('pdfParser_dataError', (errData) => {
          reject(new Error(`PDF parsing error: ${errData.parserError}`));
        });

        // Parse the PDF from the array buffer
        pdfParser.parseBuffer(Buffer.from(arrayBuffer));
      });

      text = parseResult.trim();
    } catch (parseErr) {
      console.error('PDF parsing error:', parseErr);
      return NextResponse.json(
        { error: 'Failed to parse PDF. The file may be corrupted or not a valid PDF.' },
        { status: 400 }
      );
    }    if (!text) {
      return NextResponse.json({ error: 'No readable text found in PDF' }, { status: 400 });
    }

    // Validate if the document is a Job Description
    const validationResult = JDValidationService.validateJD(text);
    
    if (!validationResult.isValidJD) {
      return NextResponse.json({
        error: 'Invalid Job Description',
        validation: {
          isValidJD: false,
          confidence: validationResult.confidence,
          message: JDValidationService.getValidationMessage(validationResult),
          suggestions: JDValidationService.getSuggestions(validationResult),
          detectedSections: validationResult.detectedSections,
          missingCriticalSections: validationResult.missingCriticalSections
        }
      }, { status: 422 }); // 422 Unprocessable Entity
    }

    // Lấy userId từ request body hoặc headers
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || req.headers.get('x-user-id');

    // Kiểm tra trùng lặp với JD đã có trước đó
    if (userId && typeof userId === 'string') {
      const duplicateJDCheck = await checkDuplicateJD(text, userId);
      
      if (duplicateJDCheck.isDuplicate) {
        return NextResponse.json({
          success: false,
          error: 'Duplicate JD detected',
          existingQuestionSet: duplicateJDCheck.existingSet,
          similarity: duplicateJDCheck.similarity,
          message: 'This JD appears to be similar to one you\'ve already processed. You can view existing questions or generate new ones with different parameters.'
        }, { status: 409 }); // Conflict status
      }
    }

    // If validation passed, return the text for question generation
    const questions = [text]; // Return full text for AI processing

    return NextResponse.json({
      success: true,
      questions,
      validation: {
        isValidJD: true,
        confidence: validationResult.confidence,
        detectedSections: validationResult.detectedSections,
        message: JDValidationService.getValidationMessage(validationResult)
      }
    });
  } catch (err) {
    console.error('PDF processing error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

// Hàm kiểm tra JD trùng lặp
async function checkDuplicateJD(jdText: string, userId: string) {
  try {
    // Lấy tất cả JD đã có của user
    const existingSets = await prisma.jdQuestions.findMany({
      where: { userId },
      select: { 
        id: true, 
        originalJDText: true, 
        jobTitle: true,
        questionType: true,
        level: true,
        questions: true,
        createdAt: true
      }
    });

    // Kiểm tra similarity với từng JD đã có
    for (const existingSet of existingSets) {
      if (!existingSet.originalJDText) continue; // Skip if originalJDText is null
      
      const similarity = calculateJDSimilarity(jdText, existingSet.originalJDText);
      
      if (similarity > 0.8) { // Ngưỡng 80% similarity
        return {
          isDuplicate: true,
          existingSet,
          similarity: Math.round(similarity * 100)
        };
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error('Error checking duplicate JD:', error);
    return { isDuplicate: false };
  }
}

// Hàm tính similarity giữa 2 JD
function calculateJDSimilarity(jd1: string, jd2: string): number {
  const normalize = (text: string) => 
    text.toLowerCase()
       .replace(/[^\w\s]/g, '')
       .replace(/\s+/g, ' ')
       .trim();

  const normalized1 = normalize(jd1);
  const normalized2 = normalize(jd2);

  // Jaccard similarity
  const words1 = new Set(normalized1.split(' '));
  const words2 = new Set(normalized2.split(' '));
  
  const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
  const union = new Set(Array.from(words1).concat(Array.from(words2)));
  
  return intersection.size / union.size;
}