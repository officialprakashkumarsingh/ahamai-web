'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  serviceURI: string
  grammars: any
  start(): void
  stop(): void
  abort(): void
  addEventListener(type: 'audiostart', listener: (event: Event) => void): void
  addEventListener(type: 'audioend', listener: (event: Event) => void): void
  addEventListener(type: 'end', listener: (event: Event) => void): void
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void
  addEventListener(type: 'nomatch', listener: (event: SpeechRecognitionEvent) => void): void
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void
  addEventListener(type: 'soundstart', listener: (event: Event) => void): void
  addEventListener(type: 'soundend', listener: (event: Event) => void): void
  addEventListener(type: 'speechstart', listener: (event: Event) => void): void
  addEventListener(type: 'speechend', listener: (event: Event) => void): void
  addEventListener(type: 'start', listener: (event: Event) => void): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface UseSpeechRecognitionOptions {
  onResult?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
  onStart?: () => void
  onEnd?: () => void
  continuous?: boolean
  interimResults?: boolean
  lang?: string
}

export function useSpeechRecognition({
  onResult,
  onError,
  onStart,
  onEnd,
  continuous = false,
  interimResults = true,
  lang = 'en-US'
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const intentionalStopRef = useRef(false)

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition()
      recognition.continuous = continuous
      recognition.interimResults = interimResults
      recognition.lang = lang

      recognition.addEventListener('start', () => {
        setIsListening(true)
        onStart?.()
      })

      recognition.addEventListener('end', () => {
        setIsListening(false)
        // Reset intentional stop flag on end
        intentionalStopRef.current = false
        onEnd?.()
      })

      recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
        let interimTranscript = ''
        let finalTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const transcript = result[0].transcript

          if (result.isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        const fullTranscript = finalTranscript || interimTranscript
        setTranscript(fullTranscript)
        onResult?.(fullTranscript, !!finalTranscript)
      })

      recognition.addEventListener('error', (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false)
        
        // Don't show error for intentional stops
        if (event.error === 'aborted' && intentionalStopRef.current) {
          intentionalStopRef.current = false
          return
        }
        
        // Provide user-friendly error messages for common errors
        let userFriendlyMessage: string
        switch (event.error) {
          case 'aborted':
            userFriendlyMessage = 'Voice input was stopped'
            break
          case 'audio-capture':
            userFriendlyMessage = 'Could not access microphone. Please check your microphone permissions.'
            break
          case 'network':
            userFriendlyMessage = 'Network error occurred during voice recognition'
            break
          case 'not-allowed':
            userFriendlyMessage = 'Microphone access denied. Please allow microphone permissions and try again.'
            break
          case 'no-speech':
            userFriendlyMessage = 'No speech detected. Please try speaking again.'
            break
          case 'service-not-allowed':
            userFriendlyMessage = 'Speech recognition service not available'
            break
          default:
            userFriendlyMessage = `Speech recognition error: ${event.error}`
        }
        
        console.error('Speech recognition error:', event.error, event)
        onError?.(userFriendlyMessage)
      })

      recognitionRef.current = recognition
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [continuous, interimResults, lang, onResult, onError, onStart, onEnd])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      intentionalStopRef.current = false
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
        onError?.('Failed to start speech recognition')
      }
    }
  }, [isListening, onError])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      intentionalStopRef.current = true
      recognitionRef.current.stop()
    }
  }, [isListening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    resetTranscript
  }
}