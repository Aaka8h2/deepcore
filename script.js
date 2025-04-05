const chatContent = document.getElementById("chat-content");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

const chatGPTLogo = "https://i.ibb.co/p6Qz6XV6/file-VMVLZgy-Rq7z9-Le8-Bgm-S8ei.jpg";
const userLogo = "https://i.ibb.co/JjwZvMqX/IMG-20241118-112140-894.jpg";

// ====================== API CALL ======================
async function fetchResponse(userMessage) {
  try {
    const apiUrl = `https://deepcore-ai-bot.aimbox77.workers.dev/?question=${encodeURIComponent(userMessage)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "I couldn't process that request. Please try again.";
  } 
  catch (error) {
    console.error("Fetch Error:", error);
    return `Error: ${error.message}`;
  }
}

// ====================== MESSAGE UTILITIES ======================
function parseMarkdown(text) {
  // Code blocks
  text = text.replace(/(```|\`\`\`)(\w*)([\s\S]*?)(```|\`\`\`)/g, 
    (_, opener, lang, code) => `
      <div class="code-block">
        <span class="language-name">${lang || 'code'}</span>
        <pre><code>${code.trim()}</code></pre>
        <button class="copy-button">📋 Copy Code</button>
      </div>
    `
  );

  // Inline code, bold, italic
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

function createMessageElement(message, fromUser, isLoading = false) {
  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("message", fromUser ? "user" : "bot");

  const avatar = document.createElement("img");
  avatar.src = fromUser ? userLogo : chatGPTLogo;
  avatar.alt = fromUser ? "You" : "AI Assistant";
  avatar.classList.add("avatar");

  const bubble = document.createElement("div");
  bubble.classList.add(isLoading ? "loading" : "bubble");

  if (isLoading) {
    bubble.innerHTML = `
      <div class="dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>`;
  } else {
    bubble.innerHTML = parseMarkdown(message);
  }

  fromUser 
    ? messageWrapper.append(bubble, avatar)
    : messageWrapper.append(avatar, bubble);

  return messageWrapper;
}

// ====================== EVENT HANDLERS ======================
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Add user message
  chatContent.appendChild(createMessageElement(userMessage, true));
  userInput.value = "";

  // Add loading indicator
  const loader = createMessageElement("", false, true);
  chatContent.appendChild(loader);
  chatContent.scrollTop = chatContent.scrollHeight;

  // Get and display bot response
  try {
    const botResponse = await fetchResponse(userMessage);
    chatContent.removeChild(loader);
    chatContent.appendChild(createMessageElement(botResponse, false));
  } catch (error) {
    chatContent.removeChild(loader);
    chatContent.appendChild(
      createMessageElement(`Error: ${error.message}`, false)
    );
  }
  
  chatContent.scrollTop = chatContent.scrollHeight;
});

// Copy code blocks
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('copy-button')) {
    const code = e.target.closest('.code-block').querySelector('code').innerText;
    navigator.clipboard.writeText(code)
      .then(() => {
        e.target.textContent = "Copied!";
        setTimeout(() => e.target.textContent = "📋 Copy Code", 2000);
      })
      .catch(err => console.error("Copy failed:", err));
  }
});

// Initial welcome message
window.addEventListener('load', () => {
  setTimeout(() => {
    chatContent.appendChild(
      createMessageElement("How can I help you today?", false)
    );
    chatContent.scrollTop = chatContent.scrollHeight;
  }, 300);
});