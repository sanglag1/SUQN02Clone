import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

if (!process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY || !process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION) {
  throw new Error("Azure Speech credentials are not configured");
}

export interface SpeechError extends Error {
  code?: string;
  details?: string;
}

// Create speech config
const createSpeechConfig = (language?: string) => {
  try {
    const config = sdk.SpeechConfig.fromSubscription(
      process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!,
      process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!
    );
    
    if (language) {
      config.speechRecognitionLanguage = language;
    }
    
    // Set security and timeout options
    config.setProperty(sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs, "5000");
    config.setProperty(sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs, "1000");
    config.setProperty(sdk.PropertyId.SpeechServiceConnection_EnableAudioLogging, "true");
    
    return config;
  } catch (error) {
    throw new Error(`Failed to create speech config: ${String(error)}`);
  }
};

export const startSpeechRecognition = async (
  onResult: (text: string) => void, 
  onError: (err: SpeechError) => void, 
  language = 'en-US'
): Promise<sdk.SpeechRecognizer | null> => {
  try {
    const sessionConfig = createSpeechConfig(language);
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(sessionConfig, audioConfig);

    recognizer.recognized = (_, e) => {
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
        onResult(e.result.text.trim());
      }
    };

    recognizer.canceled = (_, e) => {
      const error: SpeechError = new Error('Speech recognition canceled');
      error.details = e.errorDetails;
      
      console.log('Speech recognition canceled:', {
        reason: e.reason,
        errorCode: e.errorCode,
        errorDetails: e.errorDetails
      });
      
      if (e.reason === sdk.CancellationReason.Error) {
        onError(error);
      }
    };

    // Start continuous recognition
    return new Promise((resolve, reject) => {
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log("Speech recognition started successfully");
          resolve(recognizer);
        },
        (error) => {
          console.error("Error starting speech recognition:", error);
          const speechError: SpeechError = new Error('Failed to start speech recognition');
          speechError.details = String(error);
          onError(speechError);
          reject(error);
        }
      );
    });

  } catch (error) {
    console.error("Error in startSpeechRecognition:", error);
    const speechError: SpeechError = new Error('Failed to initialize speech recognition');
    speechError.details = String(error);
    onError(speechError);
    return null;
  }
};

export const stopSpeechRecognition = async (recognizer: sdk.SpeechRecognizer): Promise<void> => {
  if (!recognizer) {
    console.warn('No recognizer to stop');
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    try {
      recognizer.stopContinuousRecognitionAsync(
        () => {
          console.log("Speech recognition stopped successfully");
          try {
            recognizer.close();
            resolve();
          } catch (closeError) {
            console.error("Error closing recognizer:", closeError);
            resolve(); // Still resolve as the recognition was stopped
          }
        },
        (error) => {
          console.error("Error stopping speech recognition:", {
            error,
            errorMessage: String(error),
          });
          try {
            recognizer.close();
          } catch (closeError) {
            console.error("Error closing recognizer after stop error:", closeError);
          }
          reject(error);
        }
      );
    } catch (error) {
      console.error("Error in stopSpeechRecognition:", error);
      try {
        recognizer.close();
      } catch (closeError) {
        console.error("Error closing recognizer after exception:", closeError);
      }
      reject(error);
    }
  });
};

export const textToSpeech = async (
  text: string, 
  language = 'vi-VN', 
  voiceName = 'vi-VN-HoaiMyNeural'
): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      const sessionConfig = createSpeechConfig(language);
      sessionConfig.speechSynthesisVoiceName = voiceName;
      
      const audioConfig = sdk.AudioConfig.fromDefaultSpeakerOutput();
      const synthesizer = new sdk.SpeechSynthesizer(sessionConfig, audioConfig);

      synthesizer.SynthesisCanceled = (_: unknown, e: sdk.SpeechSynthesisEventArgs) => {
        console.error('Speech synthesis canceled:', e);
        reject(new Error(`Speech synthesis canceled: ${e?.result?.errorDetails || 'Unknown error'}`));
      };
      synthesizer.speakTextAsync(
        text,
        (result: sdk.SpeechSynthesisResult) => {
          if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            console.log('Speech synthesis successful');
            synthesizer.close();
            resolve();
          } else {
            console.error('Speech synthesis failed:', result);
            synthesizer.close();
            reject(new Error(`Speech synthesis failed: ${result?.errorDetails || 'Unknown error'}`));
          }
        },
        (error: string) => {
          console.error('Speech synthesis error:', error);
          synthesizer.close();
          reject(new Error(error));
        }
      );
    } catch (error) {
      console.error('Error in textToSpeech:', error);
      reject(error);
    }
  });
};
