import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export interface SpeechRecognitionError extends Error {
  code?: string;
  details?: string;
}

const createSpeechConfig = (language?: string) => {
  const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY;
  const speechRegion = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    console.error('Azure Speech credentials missing:', { 
      hasKey: !!speechKey, 
      hasRegion: !!speechRegion 
    });
    throw new Error("Azure Speech credentials are not configured. Please check your environment variables.");
  }

  try {
    const config = sdk.SpeechConfig.fromSubscription(speechKey, speechRegion);
    
    if (language) {
      config.speechRecognitionLanguage = language;
    }
    
    return config;
  } catch (err) {
    console.error('Error creating speech config:', err);
    throw new Error(`Failed to create speech config: ${typeof err === 'object' && err !== null && 'message' in err ? (err as Error).message : String(err)}`);
  }
};

const createSpeechError = (message: string, details?: unknown): SpeechRecognitionError => {
  const error: SpeechRecognitionError = new Error(message);
  error.details = typeof details === 'object' && details !== null && 'message' in details 
    ? (details as Error).message 
    : String(details);
  return error;
};

export interface StartRecognitionOptions {
  onInterim?: (text: string) => void;
  initialSilenceTimeoutMs?: number;
  endSilenceTimeoutMs?: number;
  enablePunctuation?: boolean;
  profanityOption?: 'Masked' | 'Removed' | 'Raw';
  phraseHints?: string[];
}

export const startVoiceRecognition = async (
  onResult: (text: string) => void, 
  onError: (err: SpeechRecognitionError) => void, 
  language = 'en-US',
  options: StartRecognitionOptions = {}
): Promise<sdk.SpeechRecognizer | null> => {
  try {
    const sessionConfig = createSpeechConfig(language);
    if (options.initialSilenceTimeoutMs != null) {
      sessionConfig.setProperty(
        sdk.PropertyId.SpeechServiceConnection_InitialSilenceTimeoutMs,
        String(options.initialSilenceTimeoutMs)
      );
    }
    if (options.endSilenceTimeoutMs != null) {
      sessionConfig.setProperty(
        sdk.PropertyId.SpeechServiceConnection_EndSilenceTimeoutMs,
        String(options.endSilenceTimeoutMs)
      );
    }
    if (options.enablePunctuation) {
      sessionConfig.setProperty(
        sdk.PropertyId.SpeechServiceResponse_PostProcessingOption,
        'TrueText'
      );
    }
    if (options.profanityOption) {
      const map: Record<string, sdk.ProfanityOption> = {
        Masked: sdk.ProfanityOption.Masked,
        Removed: sdk.ProfanityOption.Removed,
        Raw: sdk.ProfanityOption.Raw
      };
      sessionConfig.setProfanity(map[options.profanityOption]);
    }
 
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
    const recognizer = new sdk.SpeechRecognizer(sessionConfig, audioConfig);
    if (options.phraseHints && options.phraseHints.length > 0) {
      try {
        const phraseList = sdk.PhraseListGrammar.fromRecognizer(recognizer);
        for (const phrase of options.phraseHints) {
          if (phrase && phrase.trim()) phraseList.addPhrase(phrase.trim());
        }
      } catch (e) {
        console.warn('PhraseListGrammar init failed:', e);
      }
    }
 
    // Setup all event handlers before starting recognition
    recognizer.recognized = (_, e) => {
      console.log('🎯 Azure Speech recognized event:', { 
        reason: e.result.reason, 
        text: e.result.text,
        confidence: e.result.properties?.getProperty('speech.confidence')
      });
      
      if (e.result.reason === sdk.ResultReason.RecognizedSpeech && e.result.text) {
        const text = e.result.text.trim();
        if (text) {
          console.log('✅ Azure Speech final result:', text);
          onResult(text);
        } else {
          console.log('❌ Azure Speech result is empty after trim');
        }
      } else {
        console.log('❌ Azure Speech recognition failed or no speech detected');
      }
    };
 
    recognizer.recognizing = (_, e) => {
      console.log('🔄 Azure Speech recognizing:', { 
        reason: e.result.reason, 
        text: e.result.text 
      });
      
      if (e.result.reason === sdk.ResultReason.NoMatch) {
        console.log('🔍 No speech could be recognized');
      } else {
        console.log('👂 Recognizing interim:', e.result.text);
        if (options.onInterim && e.result.text) {
          options.onInterim(e.result.text);
        }
      }
    };
 
    recognizer.canceled = (_, e) => {
      const error = createSpeechError('Voice recognition canceled');
      error.code = e.errorCode?.toString();
      error.details = e.errorDetails;
      
      console.log('Voice recognition canceled:', {
        reason: e.reason,
        errorCode: e.errorCode,
        errorDetails: e.errorDetails
      });
      
      if (e.reason === sdk.CancellationReason.Error) {
        onError(error);
      }
    };
 
    recognizer.sessionStarted = (_, e) => {
      console.log('Voice recognition session started:', e);
    };
 
    recognizer.sessionStopped = (_, e) => {
      console.log('Voice recognition session stopped:', e);
    };
 
    // Start continuous recognition and wait for it to be ready
    await new Promise<void>((resolve, reject) => {
      recognizer.startContinuousRecognitionAsync(
        () => {
          console.log("Voice recognition started successfully");
          resolve();
        },
        (err) => {
          console.error("Error starting voice recognition:", err);
          const error = createSpeechError('Failed to start voice recognition', err);
          onError(error);
          try {
            recognizer.close();
          } catch (closeErr) {
            console.error("Error closing recognizer after start error:", closeErr);
          }
          reject(err);
        }
      );
    });
 
    return recognizer;
  } catch (err) {
    console.error("Error in startVoiceRecognition:", err);
    const error = createSpeechError('Failed to initialize voice recognition', err);
    onError(error);
    return null;
  }
};



export const stopVoiceRecognition = async (recognizer: sdk.SpeechRecognizer): Promise<void> => {
  if (!recognizer) {
    console.warn('No recognizer to stop');
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    try {
      // Remove all event handlers immediately
      recognizer.recognized = () => {};
      recognizer.recognizing = () => {};
      recognizer.canceled = () => {};
      recognizer.sessionStarted = () => {};
      recognizer.sessionStopped = () => {};

      // Stop recognition
      recognizer.stopContinuousRecognitionAsync(
        () => {
          try {
            recognizer.close();
          } catch (closeErr) {
            console.debug("Recognizer close error (expected):", closeErr);
          }
          resolve();
        },
        (stopErr) => {
          console.debug("Stop recognition error (expected):", stopErr);
          try {
            recognizer.close();
          } catch (closeErr) {
            console.debug("Recognizer close error (expected):", closeErr);
          }
          resolve();
        }
      );

      // Force cleanup after 500ms if stop operation hangs
      setTimeout(() => {
        try {
          recognizer.close();
        } catch (err) {
          console.debug("Force cleanup error (expected):", err);
        }
        resolve();
      }, 500);
    } catch (err) {
      console.debug("Stop recognition error:", err);
      resolve();
    }
  });
};
