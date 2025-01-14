const core = require("@actions/core");

async function createChatGPTAPI(apiKey) {
  await require('isomorphic-fetch');
  const { ChatGPTAPI } = await require("chatgpt");
  const api = new ChatGPTAPI({ apiKey });
  return api;
}

function is503or504Error(err) {
  return err.message.includes("503") || err.message.includes("504");
}

async function callChatGPT(api, content, retryOn503) {
  let cnt = 0;
  while (cnt++ <= retryOn503) {
    try {
      const response = await api.sendMessage(content);
      return response;
    } catch (err) {
      if (!is503or504Error(err)) throw err;
    }
  }
}

function startConversation(api, retryOn503) {
  return {
    retryOn503,
    async sendMessage(message, lastResponse) {
      let cnt = 0;
      while (cnt++ <= retryOn503) {
        try {
          if (lastResponse) {
            const response = await api.sendMessage(message, {
              conversationId: lastResponse.conversationId,
              parentMessageId: lastResponse.id
            });
            return response;
          } else {
            const response = await api.sendMessage(message);
            return response;
          }
        } catch (err) {
          if (!is503or504Error(err)) throw err;
          core.warning(`Got "${err}", sleep for 10s now!`);
          await new Promise((r) => setTimeout(r, 10000));
        }
      }
    },
  };
}

module.exports = { createChatGPTAPI, callChatGPT, startConversation };
