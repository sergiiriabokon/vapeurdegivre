import type { NPC } from '../types';
import { eventBus } from '../engine/EventBus';

export class ChatOverlay {
  private element: HTMLElement;
  private messagesContainer: HTMLElement | null = null;
  private inputElement: HTMLInputElement | null = null;
  private sendButton: HTMLButtonElement | null = null;
  private typingIndicator: HTMLElement | null = null;
  private currentNPC: NPC | null = null;

  constructor(selector: string) {
    const el = document.querySelector<HTMLElement>(selector);
    if (!el) {
      throw new Error(`ChatOverlay element not found: ${selector}`);
    }
    this.element = el;
    this.render();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="chat-header">
        <img class="npc-portrait" src="" alt="NPC Portrait" />
        <span class="npc-name"></span>
      </div>
      <div class="chat-messages"></div>
      <div class="chat-input-container">
        <input type="text" class="chat-input" placeholder="Type your message..." />
        <button class="chat-send-btn">Send</button>
      </div>
    `;

    this.messagesContainer = this.element.querySelector('.chat-messages');
    this.inputElement = this.element.querySelector('.chat-input');
    this.sendButton = this.element.querySelector('.chat-send-btn');

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Send button click
    this.sendButton?.addEventListener('click', () => this.handleSend());

    // Enter key press
    this.inputElement?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });
  }

  private handleSend(): void {
    if (!this.inputElement) return;

    const message = this.inputElement.value.trim();
    if (!message) return;

    // Clear input
    this.inputElement.value = '';

    // Emit message event
    eventBus.emit('chat:message', { role: 'user', message });
  }

  setNPC(npc: NPC): void {
    this.currentNPC = npc;

    const portraitEl = this.element.querySelector<HTMLImageElement>('.npc-portrait');
    const nameEl = this.element.querySelector('.npc-name');

    if (portraitEl) {
      portraitEl.src = npc.portrait;
      portraitEl.alt = `${npc.name} portrait`;
      // Handle missing portrait
      portraitEl.onerror = () => {
        portraitEl.style.display = 'none';
      };
      portraitEl.onload = () => {
        portraitEl.style.display = 'block';
      };
    }

    if (nameEl) {
      nameEl.textContent = npc.name;
    }

    // Clear previous messages
    this.clearMessages();
  }

  addMessage(role: 'user' | 'npc', message: string): void {
    if (!this.messagesContainer) return;

    // Remove typing indicator if present
    this.removeTypingIndicator();

    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${role}`;
    messageEl.textContent = message;

    this.messagesContainer.appendChild(messageEl);
    this.scrollToBottom();
  }

  setTyping(isTyping: boolean): void {
    if (isTyping) {
      this.showTypingIndicator();
    } else {
      this.removeTypingIndicator();
    }

    // Disable input while typing
    if (this.inputElement) {
      this.inputElement.disabled = isTyping;
    }
    if (this.sendButton) {
      this.sendButton.disabled = isTyping;
    }

    eventBus.emit('chat:typing', { isTyping });
  }

  private showTypingIndicator(): void {
    if (!this.messagesContainer || this.typingIndicator) return;

    this.typingIndicator = document.createElement('div');
    this.typingIndicator.className = 'chat-message npc typing';
    this.typingIndicator.textContent = this.currentNPC?.name || 'NPC';

    this.messagesContainer.appendChild(this.typingIndicator);
    this.scrollToBottom();
  }

  private removeTypingIndicator(): void {
    if (this.typingIndicator) {
      this.typingIndicator.remove();
      this.typingIndicator = null;
    }
  }

  clearMessages(): void {
    if (this.messagesContainer) {
      this.messagesContainer.innerHTML = '';
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }

  setInputValue(value: string): void {
    if (this.inputElement) {
      this.inputElement.value = value;
    }
  }

  focusInput(): void {
    this.inputElement?.focus();
  }

  show(): void {
    this.element.classList.remove('hidden');
  }

  hide(): void {
    this.element.classList.add('hidden');
  }

  getElement(): HTMLElement {
    return this.element;
  }
}
