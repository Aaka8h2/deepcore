const chatContent = document.getElementById("chat-content");
const chatForm = document.getElementById("chat-form");
const userInput = document.getElementById("user-input");

const chatGPTLogo = "https://i.ibb.co/p6Qz6XV6/file-VMVLZgy-Rq7z9-Le8-Bgm-S8ei.jpg";
const userLogo = "https://i.ibb.co/JjwZvMqX/IMG-20241118-112140-894.jpg";

// Function to copy code from a code block
function copyCode(button) {
  const codeBlock = button.closest('.code-block');
  let codeText = codeBlock.querySelector("pre code").innerText;
  
  // Remove language name if it's the first line and matches a common pattern
  const lines = codeText.split('\n');
  if (lines.length > 1 && /^[a-zA-Z]+$/.test(lines[0].trim())) {
    codeText = lines.slice(1).join('\n').trim();
  }
  
  navigator.clipboard.writeText(codeText).then(() => {
    button.innerText = "Copied!";
    setTimeout(() => {
      button.innerText = "📋 Copy Code";
    }, 2000);
  }).catch(err => {
    console.error("Could not copy text: ", err);
  });
}

// Use event delegation for copy buttons
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('copy-button')) {
    copyCode(e.target);
  }
});

// Improved markdown parser with better code block handling
function parseMarkdown(text) {
  // Handle code blocks with potential variations
  text = text.replace(/(```|\`\`\`)(\w*)([\s\S]*?)(```|\`\`\`)/g, function(match, opener, language, code, closer) {
    const cleanedCode = code.replace(/^\n+|\n+$/g, ''); // Trim only newlines
    const lang = language.trim() || 'code';
    
    return `<div class="code-block">
              <span class="language-name">${lang}</span>
              <pre><code>${cleanedCode}</code></pre>
              <button class="copy-button">📋 Copy Code</button>
            </div>`;
  });
  
  // Handle inline code that might have incorrect backticks
  text = text.replace(/(^|\W)`([^`\n]+)`(\W|$)/g, '$1<code>$2</code>$3');
  
  // Bold text (both ** and __ syntax)
  text = text.replace(/(\*\*|__)([^*_]+)(\*\*|__)/g, '<strong>$2</strong>');
  
  // Italic text (both * and _ syntax)
  text = text.replace(/(\*|_)([^*_\n]+)(\*|_)/g, '<em>$2</em>');
  
  // Handle multiple newlines (convert to <br> but not more than 2 consecutive)
  text = text.replace(/\n{1,2}/g, '<br/>');
  
  return text;
}

// Create message element
function createMessageElement(message, fromUser, isLoading = false) {
  const messageWrapper = document.createElement("div");
  messageWrapper.classList.add("message", fromUser ? "user" : "bot");

  const avatar = document.createElement("img");
  avatar.src = fromUser ? userLogo : chatGPTLogo;
  avatar.alt = fromUser ? "User" : "ChatGPT";
  avatar.classList.add("avatar");

  const bubble = document.createElement("div");
  if (isLoading) {
    bubble.classList.add("loading");
    bubble.innerHTML = `<div class="dots">
                          <div class="dot"></div>
                          <div class="dot"></div>
                          <div class="dot"></div>
                        </div>`;
  } else {
    bubble.classList.add("bubble");
    bubble.innerHTML = parseMarkdown(message);
  }

  // Append elements with proper positioning
  if (fromUser) {
    messageWrapper.appendChild(bubble);
    messageWrapper.appendChild(avatar);
  } else {
    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(bubble);
  }

  return messageWrapper;
}

// Function to fetch response from API (UPDATED)
async function fetchResponse(userMessage) {
  try {
    const apiUrl = `https://deepcore-ai-bot.aimbox77.workers.dev/?question=${encodeURIComponent(userMessage)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error("API Error:", response.status);
      return `API Error (Status: ${response.status}). Please try again.`;
    }

    const data = await response.json();
    
    // Try common response fields (adjust based on your API's actual structure)
    return data.response || data.answer || data.text || data.message || 
           data.content || JSON.stringify(data).slice(0, 200) + "...";
  } 
  catch (error) {
    console.error("Network Error:", error);
    return "Network Error: Check console for details.";
  }
}

// Handle the user input and send it to the API
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const userMessage = userInput.value.trim();
  if (!userMessage) return;

  // Add user message to chat
  chatContent.appendChild(createMessageElement(userMessage, true));
  userInput.value = "";

  // Show loading indicator
  const loadingMessage = createMessageElement("", false, true);
  chatContent.appendChild(loadingMessage);
  chatContent.scrollTop = chatContent.scrollHeight;

  try {
    const botResponse = await fetchResponse(userMessage);
    chatContent.removeChild(loadingMessage);
    chatContent.appendChild(createMessageElement(botResponse, false));
  } catch (error) {
    chatContent.removeChild(loadingMessage);
    chatContent.appendChild(
      createMessageElement("Failed to get response. Check console.", false)
    );
    console.error("Submission Error:", error);
  }
  
  chatContent.scrollTop = chatContent.scrollHeight;
});

// Initial welcome message
window.addEventListener('load', () => {
  setTimeout(() => {
    const welcomeMessage = createMessageElement("How can I help you today?", false);
    chatContent.appendChild(welcomeMessage);
    chatContent.scrollTop = chatContent.scrollHeight;
  }, 100);
});