import { engine } from './engine/Engine';
import { eventBus } from './engine/EventBus';

async function main() {
  // Set up global error handling
  eventBus.on('error', ({ message, error }) => {
    console.error('Game error:', message, error);
    showError(message);
  });

  try {
    await engine.init();
    console.log('Vapeur de Givre initialized successfully');
  } catch (error) {
    console.error('Failed to initialize game:', error);
    showError('Failed to load the game. Please refresh the page.');
  }
}

function showError(message: string) {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.innerHTML = `
      <div class="loading-content">
        <p style="color: var(--color-error);">${message}</p>
        <button onclick="location.reload()" style="margin-top: 16px; padding: 8px 16px; cursor: pointer;">
          Refresh
        </button>
      </div>
    `;
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
