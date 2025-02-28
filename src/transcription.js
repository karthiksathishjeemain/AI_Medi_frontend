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
    // console.log("api console is ", process.env.VITE_DEEPGRAM_API_KEY);
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    socket = new WebSocket('wss://api.deepgram.com/v1/listen?diarize=true', [
      'token',
      "eb6ac694e0644e50bebfd78351de0e2e4f2bd213",
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

        if (received.channel &&
            received.channel.alternatives &&
            received.channel.alternatives[0]) {

          const alternative = received.channel.alternatives[0];
          const transcript = alternative.transcript;

          if (alternative.words && alternative.words.length > 0 && received.is_final) {

            const speakerSegment = {
              speaker: getSpeakerFromWords(alternative.words),
              text: transcript.trim()
            };
            console.log('Transcript with speaker:', speakerSegment);
            setTranscript(speakerSegment);
          } else if (transcript && received.is_final) {

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


    return () => {
      console.log('Cleaning up transcription resources');


      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        console.log('Stopping MediaRecorder');
        mediaRecorder.stop();
      } else {
        console.log('MediaRecorder was already inactive or not initialized');
      }


      if (socket) {
        console.log('WebSocket readyState before closing:', socket.readyState);

        try {
          socket.close(1000, "Deliberate disconnection");
          console.log('WebSocket close method called');
        } catch (e) {
          console.error('Error closing WebSocket:', e);
        }
      } else {
        console.log('WebSocket was not initialized');
      }

      if (stream) {
        console.log('Stopping audio tracks. Track count:', stream.getTracks().length);
        stream.getTracks().forEach(track => {
          track.stop();
          console.log(`Audio track ${track.id} stopped. Track enabled:`, track.enabled);
        });
      } else {
        console.log('Stream was not initialized');
      }


      mediaRecorder = null;
      socket = null;
      stream = null;
      console.log('Cleanup complete');
    };
  } catch (error) {
    console.error('Error accessing microphone:', error);

  
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
