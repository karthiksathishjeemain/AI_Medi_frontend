export async function startTranscription(setTranscript) {
  let stream = null;
  let mediaRecorder = null;
  let socket = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    if (!MediaRecorder.isTypeSupported('audio/webm')) {
      alert('Browser not supported');
      return;
    }
    console.log("api console is ", process.env.VUE_APP_DEEPGRAM_API_KEY);
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    socket = new WebSocket('wss://api.deepgram.com/v1/listen?diarize=true', [
      'token',
      process.env.VUE_APP_DEEPGRAM_API_KEY,
    ]);

    socket.onopen = () => {
      console.log('WebSocket Connected');
      mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0 && socket.readyState === 1) {
          socket.send(event.data);
        }
      });
      mediaRecorder.start(1000);
    };

    socket.onmessage = (message) => {
      try {
        const received = JSON.parse(message.data);

        // Check if we have speaker diarization data
        if (received.channel &&
            received.channel.alternatives &&
            received.channel.alternatives[0]) {

          const alternative = received.channel.alternatives[0];
          const transcript = alternative.transcript;

          // Check if there are words with speaker info
          if (alternative.words && alternative.words.length > 0 && received.is_final) {
            // Process the words with speaker information
            const speakerSegment = {
              speaker: getSpeakerFromWords(alternative.words),
              text: transcript.trim()
            };
            console.log('Transcript with speaker:', speakerSegment);
            setTranscript(speakerSegment);
          } else if (transcript && received.is_final) {
            // Fallback if no speaker info available
            console.log('Transcript (no speaker info):', transcript);
            setTranscript({ text: transcript.trim(), speaker: null });
          }
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    socket.onclose = () => console.log('WebSocket Closed');
    socket.onerror = (error) => console.error('WebSocket Error:', error);

    // Return cleanup function that properly stops everything
    return () => {
      console.log('Cleaning up transcription resources');

      // Check if mediaRecorder is active before stopping
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        console.log('Stopping MediaRecorder');
        mediaRecorder.stop();
      } else {
        console.log('MediaRecorder was already inactive or not initialized');
      }

      // Close the WebSocket connection with more explicit logging
      if (socket) {
        console.log('WebSocket readyState before closing:', socket.readyState);
        // Force close regardless of current state
        try {
          socket.close(1000, "Deliberate disconnection");
          console.log('WebSocket close method called');
        } catch (e) {
          console.error('Error closing WebSocket:', e);
        }
      } else {
        console.log('WebSocket was not initialized');
      }

      // Ensure all audio tracks are properly stopped
      if (stream) {
        console.log('Stopping audio tracks. Track count:', stream.getTracks().length);
        stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Audio track ${track.id} stopped. Track enabled:`, track.enabled);
        });
      } else {
        console.log('Stream was not initialized');
      }

      // Set variables to null to help garbage collection
      mediaRecorder = null;
      socket = null;
      stream = null;
      console.log('Cleanup complete');
    };
  } catch (error) {
    console.error('Error accessing microphone:', error);

    // Clean up resources in case of error
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  }
}

// Helper function to determine the most likely speaker from words
function getSpeakerFromWords(words) {
  if (!words || words.length === 0) return null;

  // Count occurrences of each speaker
  const speakerCounts = {};
  for (const word of words) {
    if (word.speaker !== undefined) {
      const speaker = `Speaker ${parseInt(word.speaker) + 1}`;
      speakerCounts[speaker] = (speakerCounts[speaker] || 0) + 1;
    }
  }

  // Find the most frequent speaker
  let maxCount = 0;
  let dominantSpeaker = null;

  for (const speaker in speakerCounts) {
    if (speakerCounts[speaker] > maxCount) {
      maxCount = speakerCounts[speaker];
      dominantSpeaker = speaker;
    }
  }

  return dominantSpeaker;
}
