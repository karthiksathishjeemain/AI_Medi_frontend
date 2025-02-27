<template>
  <div class="component-container">
    <h3>Transcription</h3>
    <div class="transcript-container" ref="transcriptContainer">
      <div v-for="(segment, index) in combinedTranscriptSegments" :key="index" class="transcript-segment">
        <div v-if="segment.speaker" class="speaker-label">{{ segment.speaker }}</div>
        <div class="transcript-text">{{ segment.text }}</div>
      </div>
      <div v-if="partialTranscript" class="partial-transcript">
        <div v-if="partialTranscript.speaker" class="speaker-label">{{ partialTranscript.speaker }}</div>
        <div class="transcript-text">{{ partialTranscript.text }}</div>
      </div>
    </div>
    <div class="controls">
      <button @click="startTranscriptionHandler" :disabled="isRecording">Start</button>
      <button @click="stopTranscription" :disabled="!isRecording">Stop</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';
import { startTranscription } from '../transcription';

export default {
  setup(props, { emit }) {
    const transcriptSegments = ref([]);
    const partialTranscript = ref(null);
    const isRecording = ref(false);
    const transcriptContainer = ref(null);
    let cleanupFn = null;

    // Computed property that combines consecutive segments from the same speaker
    const combinedTranscriptSegments = computed(() => {
      const combined = [];
      let currentSegment = null;

      transcriptSegments.value.forEach(segment => {
        // If this is the first segment or we have a new speaker
        if (!currentSegment || currentSegment.speaker !== segment.speaker) {
          // Add the previous combined segment if it exists
          if (currentSegment) {
            combined.push(currentSegment);
          }

          // Start a new combined segment
          currentSegment = {
            speaker: segment.speaker,
            text: segment.text
          };
        } else {
          // Same speaker, append the text with appropriate punctuation
          const lastChar = currentSegment.text.trim().slice(-1);
          const separator = ['.', '!', '?', ',', ':'].includes(lastChar) ? ' ' : '. ';
          currentSegment.text += separator + segment.text;
        }
      });

      // Add the final segment if it exists
      if (currentSegment) {
        combined.push(currentSegment);
      }

      return combined;
    });

    // Function to scroll to the bottom of the transcript container
    const scrollToBottom = async () => {
      if (transcriptContainer.value) {
        // Wait for the DOM to update before scrolling
        await nextTick();
        transcriptContainer.value.scrollTop = transcriptContainer.value.scrollHeight;
      }
    };

    const startTranscriptionHandler = () => {
      // Ensure we're not already recording
      if (isRecording.value) {
        console.log('Already recording, stopping previous session first');
        stopTranscription();
      }

      console.log('Starting new transcription session');
      isRecording.value = true;

      cleanupFn = startTranscription((newSegment) => {
        if (newSegment) {
          transcriptSegments.value = [...transcriptSegments.value, newSegment];
          partialTranscript.value = null;
          // Scroll to bottom when new content is added
          scrollToBottom();
        }
      });

      console.log('Cleanup function assigned:', !!cleanupFn);
    };

    const stopTranscription = () => {
      console.log('Stop button pressed, cleanup function exists:', !!cleanupFn);

      if (cleanupFn && typeof cleanupFn === 'function') {
        try {
          console.log('Calling cleanup function');
          cleanupFn();
          console.log('Cleanup function completed');
        } catch (error) {
          console.error('Error during cleanup:', error);
        }
      } else {
        console.warn('No cleanup function to call');
      }

      // Reset the cleanup function and recording state
      cleanupFn = null;
      isRecording.value = false;
    };

    // Create a computed property that combines all transcript segments into a single string
    const fullTranscriptText = computed(() => {
      return combinedTranscriptSegments.value.map(segment => {
        return `${segment.speaker}: ${segment.text}`;
      }).join('\n\n');
    });

    // Watch for changes to the transcript and emit updates
    watch(fullTranscriptText, (newTranscript) => {
      if (newTranscript) {
        emit('transcription-update', newTranscript);
      }
    });

    // Watch for changes to combinedTranscriptSegments or partialTranscript and scroll to bottom
    watch([combinedTranscriptSegments, partialTranscript], () => {
      scrollToBottom();
    });

    return {
      transcriptSegments,
      combinedTranscriptSegments,
      partialTranscript,
      isRecording,
      startTranscriptionHandler,
      stopTranscription,
      fullTranscriptText,
      transcriptContainer
    };
  },
};
</script>

<style scoped>
.component-container {
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 15px;
}

h3 {
  font-size: 1.3rem;
  margin-top: 0;
  margin-bottom: 12px;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.transcript-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 12px;
  background-color: white;
  scroll-behavior: smooth; /* Add smooth scrolling effect */
}

.transcript-segment {
  margin-bottom: 12px;
}

.speaker-label {
  font-weight: bold;
  color: #444;
  margin-bottom: 2px;
  font-size: 0.9rem;
}

.transcript-text {
  padding-left: 8px;
  border-left: 3px solid #0066cc;
  line-height: 1.5;
}

.partial-transcript {
  opacity: 0.7;
  font-style: italic;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #ccc;
}

.controls {
  display: flex;
  gap: 8px;
}

button {
  padding: 8px 16px;
  background-color: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #0055aa;
}
</style>
