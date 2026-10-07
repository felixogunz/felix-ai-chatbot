"use strict";

/* DOM elements */

const sidebar =
    document.getElementById("sidebar");

const sidebarBackdrop =
    document.getElementById("sidebarBackdrop");

const newChatButton =
    document.getElementById("newChatButton");

const headerNewChatButton =
    document.getElementById("headerNewChatButton");

const searchInput =
    document.getElementById("searchInput");

const conversationList =
    document.getElementById("conversationList");

const themeButton =
    document.getElementById("themeButton");

const settingsButton =
    document.getElementById("settingsButton");

const openSidebarButton =
    document.getElementById("openSidebarButton");

const closeSidebarButton =
    document.getElementById("closeSidebarButton");

const modelSelectorButton =
    document.getElementById("modelSelectorButton");

const modelDropdown =
    document.getElementById("modelDropdown");

const selectedModel =
    document.getElementById("selectedModel");

const welcomeScreen =
    document.getElementById("welcomeScreen");

const messageContainer =
    document.getElementById("messageContainer");

const typingContainer =
    document.getElementById("typingContainer");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const stopButton =
    document.getElementById("stopButton");

const attachmentButton =
    document.getElementById("attachmentButton");

const fileInput =
    document.getElementById("fileInput");

const attachmentPreview =
    document.getElementById("attachmentPreview");

const notification =
    document.getElementById("notification");

/* Settings elements */

const settingsOverlay =
    document.getElementById("settingsOverlay");

const settingsCloseButton =
    document.getElementById("settingsCloseButton");

const settingsDoneButton =
    document.getElementById("settingsDoneButton");

const settingsTheme =
    document.getElementById("settingsTheme");

const settingsEnterToSend =
    document.getElementById("settingsEnterToSend");

const settingsConversationHistory =
    document.getElementById(
        "settingsConversationHistory"
    );

const settingsFileAttachments =
    document.getElementById(
        "settingsFileAttachments"
    );

const settingsCurrentModel =
    document.getElementById(
        "settingsCurrentModel"
    );

/* Application state */

let currentConversationId = null;

let selectedFileText = "";

let selectedFileName = "";

let currentAbortController = null;

let isSending = false;

let searchTimer = null;

let notificationTimer = null;

let settings = {
    enterToSend: true,
    conversationHistory: true,
    fileAttachments: true
};

/* Start application */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);

async function initializeApp() {

    setupEventListeners();

    loadTheme();

    loadSettings();

    await loadConversations();

    messageInput.focus();

}

/* Event listeners */

function setupEventListeners() {

    newChatButton.addEventListener(
        "click",
        createNewChat
    );

    headerNewChatButton.addEventListener(
        "click",
        createNewChat
    );

    sendButton.addEventListener(
        "click",
        sendMessage
    );

    messageInput.addEventListener(
        "keydown",
        handleMessageKeydown
    );

    messageInput.addEventListener(
        "input",
        resizeTextarea
    );

    stopButton.addEventListener(
        "click",
        stopGeneration
    );

    searchInput.addEventListener(
        "input",
        handleSearch
    );

    attachmentButton.addEventListener(
        "click",
        function() {

            if (!settings.fileAttachments) {

                showNotification(
                    "File attachments are disabled in Settings."
                );

                return;
            }

            fileInput.click();

        }
    );

    fileInput.addEventListener(
        "change",
        handleFileSelection
    );

    themeButton.addEventListener(
        "click",
        toggleTheme
    );

    settingsButton.addEventListener(
        "click",
        openSettings
    );

    settingsCloseButton.addEventListener(
        "click",
        closeSettings
    );

    settingsDoneButton.addEventListener(
        "click",
        closeSettings
    );

    settingsOverlay.addEventListener(
        "click",
        handleSettingsOverlayClick
    );

    settingsTheme.addEventListener(
        "change",
        handleSettingsThemeChange
    );

    settingsEnterToSend.addEventListener(
        "change",
        saveSettingsFromControls
    );

    settingsConversationHistory.addEventListener(
        "change",
        saveSettingsFromControls
    );

    settingsFileAttachments.addEventListener(
        "change",
        saveSettingsFromControls
    );

    openSidebarButton.addEventListener(
        "click",
        openSidebar
    );

    closeSidebarButton.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            event.stopPropagation();

            closeSidebar();

        }
    );

    sidebarBackdrop.addEventListener(
        "click",
        closeSidebar
    );

    modelSelectorButton.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            const isOpen =
                modelDropdown.classList.toggle("show");

            modelSelectorButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );

    document.addEventListener(
        "click",
        function(event) {

            if (
                !modelDropdown.contains(event.target) &&
                !modelSelectorButton.contains(event.target)
            ) {

                closeModelDropdown();

            }

        }
    );

    document
        .querySelectorAll(".model-option")
        .forEach(
            function(option) {

                option.addEventListener(
                    "click",
                    function() {

                        selectModel(option);

                    }
                );

            }
        );

    document
        .querySelectorAll(".suggestion-card")
        .forEach(
            function(card) {

                card.addEventListener(
                    "click",
                    function() {

                        messageInput.value =
                            card.dataset.prompt;

                        resizeTextarea();

                        messageInput.focus();

                    }
                );

            }
        );

    document.addEventListener(
        "keydown",
        function(event) {

            if (event.key !== "Escape") {
                return;
            }

            if (
                settingsOverlay.classList.contains("show")
            ) {

                closeSettings();

                return;
            }

            closeModelDropdown();

            closeSidebar();

        }
    );

}

/* Create a new chat */

function createNewChat() {

    if (isSending) {

        showNotification(
            "Stop the current response before starting a new chat."
        );

        return;
    }

    currentConversationId = null;

    selectedFileText = "";

    selectedFileName = "";

    messageContainer.innerHTML = "";

    welcomeScreen.style.display = "flex";

    hideTyping();

    clearAttachment();

    messageInput.value = "";

    resizeTextarea();

    closeSidebar();

    messageInput.focus();

}

/* Send a message */

async function sendMessage() {

    const message =
        messageInput.value.trim();

    if (!message && !selectedFileText) {
        return;
    }

    if (isSending) {
        return;
    }

    isSending = true;

    setSendingState(true);

    welcomeScreen.style.display = "none";

    addUserMessage(
        message,
        selectedFileName
    );

    const fileText =
        selectedFileText;

    messageInput.value = "";

    clearAttachment();

    resizeTextarea();

    showTyping();

    currentAbortController =
        new AbortController();

    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: message,
                        conversation_id:
                            currentConversationId,
                        file_text:
                            fileText
                    }),

                    signal:
                        currentAbortController.signal
                }
            );

        const data =
            await parseJsonResponse(response);

        if (!response.ok) {

            throw new Error(
                data.error ||
                "The server returned an error."
            );

        }

        if (data.conversation_id) {

            currentConversationId =
                data.conversation_id;

        }

        hideTyping();

        addAssistantMessage(
            data.response ||
            data.message ||
            "No response was returned."
        );

        if (settings.conversationHistory) {

            await loadConversations();

        }

    }

    catch (error) {

        hideTyping();

        if (
            error.name === "AbortError"
        ) {

            addAssistantMessage(
                "Response stopped."
            );

        }

        else {

            console.error(error);

            addAssistantMessage(
                "Sorry, something went wrong while generating the response."
            );

        }

    }

    finally {

        currentAbortController = null;

        isSending = false;

        setSendingState(false);

        messageInput.focus();

    }

}

/* Read JSON returned by the server */

async function parseJsonResponse(response) {

    const text =
        await response.text();

    if (!text) {

        return {
            error:
                "The server returned an empty response."
        };

    }

    try {

        return JSON.parse(text);

    }

    catch (error) {

        return {
            error:
                "The server returned invalid JSON."
        };

    }

}

/* Stop AI response */

function stopGeneration() {

    if (currentAbortController) {

        currentAbortController.abort();

    }

}

/* Change interface while sending */

function setSendingState(sending) {

    sendButton.disabled =
        sending;

    messageInput.disabled =
        sending;

    attachmentButton.disabled =
        sending;

    stopButton.hidden =
        !sending;

}

/* Display user message */

function addUserMessage(
    message,
    fileName = ""
) {

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "message user";

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    let html =
        escapeHtml(message);

    html =
        html.replace(
            /\n/g,
            "<br>"
        );

    if (fileName) {

        html +=
            `<div class="attachment-item">
                Attached: ${escapeHtml(fileName)}
            </div>`;

    }

    content.innerHTML =
        html;

    messageElement.appendChild(
        content
    );

    messageContainer.appendChild(
        messageElement
    );

    scrollChatToBottom();

}

/* Display assistant message */

function addAssistantMessage(
    message
) {

    const messageElement =
        document.createElement("div");

    messageElement.className =
        "message assistant";

    const avatar =
        document.createElement("div");

    avatar.className =
        "message-avatar";

    avatar.textContent =
        "F";

    const content =
        document.createElement("div");

    content.className =
        "message-content";

    let html;

    if (
        typeof marked !== "undefined"
    ) {

        html =
            marked.parse(message);

    }

    else {

        html =
            escapeHtml(message)
                .replace(
                    /\n/g,
                    "<br>"
                );

    }

    if (
        typeof DOMPurify !== "undefined"
    ) {

        html =
            DOMPurify.sanitize(html);

    }

    content.innerHTML =
        html;

    messageElement.appendChild(
        avatar
    );

    messageElement.appendChild(
        content
    );

    messageContainer.appendChild(
        messageElement
    );

    addCodeCopyButtons(
        messageElement
    );

    scrollChatToBottom();

}

/* Add copy buttons to code blocks */

function addCodeCopyButtons(
    messageElement
) {

    const codeBlocks =
        messageElement.querySelectorAll(
            "pre"
        );

    codeBlocks.forEach(
        function(pre) {

            const wrapper =
                document.createElement(
                    "div"
                );

            wrapper.className =
                "code-wrapper";

            const header =
                document.createElement(
                    "div"
                );

            header.className =
                "code-header";

            const label =
                document.createElement(
                    "span"
                );

            label.textContent =
                "Code";

            const copyButton =
                document.createElement(
                    "button"
                );

            copyButton.className =
                "copy-code-button";

            copyButton.textContent =
                "Copy";

            copyButton.type =
                "button";

            copyButton.addEventListener(
                "click",
                async function() {

                    const code =
                        pre.textContent;

                    try {

                        await navigator.clipboard.writeText(
                            code
                        );

                        copyButton.textContent =
                            "Copied!";

                        setTimeout(
                            function() {

                                copyButton.textContent =
                                    "Copy";

                            },
                            1500
                        );

                    }

                    catch (error) {

                        showNotification(
                            "Unable to copy code."
                        );

                    }

                }
            );

            header.appendChild(
                label
            );

            header.appendChild(
                copyButton
            );

            pre.parentNode.insertBefore(
                wrapper,
                pre
            );

            wrapper.appendChild(
                header
            );

            wrapper.appendChild(
                pre
            );

        }
    );

}

/* Load conversations */

async function loadConversations(
    searchTerm = ""
) {

    try {

        let url =
            "/api/conversations";

        if (searchTerm) {

            url +=
                `?search=${encodeURIComponent(searchTerm)}`;

        }

        const response =
            await fetch(url);

        const data =
            await parseJsonResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load conversations."
            );

        }

        displayConversations(
            data.conversations ||
            data
        );

    }

    catch (error) {

        console.error(error);

        conversationList.innerHTML =
            `
            <div
                style="
                    padding:10px;
                    color:var(--muted);
                    font-size:13px;
                "
            >
                Unable to load conversations.
            </div>
            `;

    }

}

/* Display conversations */

function displayConversations(
    conversations
) {

    conversationList.innerHTML =
        "";

    if (
        !conversations ||
        conversations.length === 0
    ) {

        const empty =
            document.createElement("div");

        empty.style.padding =
            "10px";

        empty.style.color =
            "var(--muted)";

        empty.style.fontSize =
            "13px";

        empty.textContent =
            searchInput.value.trim()
                ? "No conversations found."
                : "No conversations yet.";

        conversationList.appendChild(
            empty
        );

        return;
    }

    conversations.forEach(
        function(conversation) {

            const item =
                document.createElement("div");

            item.className =
                "conversation-item";

            if (
                String(conversation.id) ===
                String(currentConversationId)
            ) {

                item.classList.add(
                    "active"
                );

            }

            const titleButton =
                document.createElement(
                    "button"
                );

            titleButton.type =
                "button";

            titleButton.className =
                "conversation-title";

            titleButton.textContent =
                conversation.title ||
                "New conversation";

            titleButton.addEventListener(
                "click",
                function() {

                    openConversation(
                        conversation.id
                    );

                }
            );

            const menuButton =
                document.createElement(
                    "button"
                );

            menuButton.type =
                "button";

            menuButton.className =
                "conversation-menu-button";

            menuButton.textContent =
                "⋯";

            menuButton.addEventListener(
                "click",
                function(event) {

                    event.stopPropagation();

                    showConversationMenu(
                        conversation,
                        menuButton
                    );

                }
            );

            item.appendChild(
                titleButton
            );

            item.appendChild(
                menuButton
            );

            conversationList.appendChild(
                item
            );

        }
    );

}

/* Open a conversation */

async function openConversation(
    conversationId
) {

    if (isSending) {

        showNotification(
            "Stop the current response first."
        );

        return;
    }

    try {

        const response =
            await fetch(
                `/api/conversations/${conversationId}`
            );

        const data =
            await parseJsonResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to open conversation."
            );

        }

        currentConversationId =
            conversationId;

        messageContainer.innerHTML =
            "";

        welcomeScreen.style.display =
            "none";

        const messages =
            data.messages || [];

        messages.forEach(
            function(message) {

                if (
                    message.role === "user"
                ) {

                    addUserMessage(
                        message.content
                    );

                }

                else {

                    addAssistantMessage(
                        message.content
                    );

                }

            }
        );

        closeSidebar();

        closeModelDropdown();

        messageInput.focus();

        if (
            settings.conversationHistory
        ) {

            await loadConversations();

        }

    }

    catch (error) {

        console.error(error);

        showNotification(
            "Unable to open conversation."
        );

    }

}

/* Search conversations */

function handleSearch() {

    clearTimeout(
        searchTimer
    );

    searchTimer =
        setTimeout(
            function() {

                loadConversations(
                    searchInput.value.trim()
                );

            },
            250
        );

}

/* Conversation menu */

function showConversationMenu(
    conversation,
    button
) {

    const existingMenu =
        document.querySelector(
            ".conversation-context-menu"
        );

    if (existingMenu) {

        existingMenu.remove();

    }

    const menu =
        document.createElement("div");

    menu.className =
        "conversation-context-menu";

    const renameButton =
        document.createElement("button");

    renameButton.type =
        "button";

    renameButton.textContent =
        "Rename";

    renameButton.addEventListener(
        "click",
        function() {

            renameConversation(
                conversation
            );

            menu.remove();

        }
    );

    const deleteButton =
        document.createElement("button");

    deleteButton.type =
        "button";

    deleteButton.textContent =
        "Delete";

    deleteButton.addEventListener(
        "click",
        function() {

            deleteConversation(
                conversation
            );

            menu.remove();

        }
    );

    menu.appendChild(
        renameButton
    );

    menu.appendChild(
        deleteButton
    );

    document.body.appendChild(
        menu
    );

    const rect =
        button.getBoundingClientRect();

    menu.style.top =
        `${rect.bottom + 5}px`;

    menu.style.left =
        `${Math.max(
            8,
            rect.right - menu.offsetWidth
        )}px`;

    setTimeout(
        function() {

            document.addEventListener(
                "click",
                function closeMenu(event) {

                    if (
                        !menu.contains(
                            event.target
                        )
                    ) {

                        menu.remove();

                        document.removeEventListener(
                            "click",
                            closeMenu
                        );

                    }

                }
            );

        },
        0
    );

}

/* Rename conversation */

async function renameConversation(
    conversation
) {

    const newTitle =
        window.prompt(
            "Enter a new conversation title:",
            conversation.title || ""
        );

    if (
        !newTitle ||
        !newTitle.trim()
    ) {

        return;

    }

    try {

        const response =
            await fetch(
                `/api/conversations/${conversation.id}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        title:
                            newTitle.trim()
                    })
                }
            );

        const data =
            await parseJsonResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to rename conversation."
            );

        }

        await loadConversations();

    }

    catch (error) {

        console.error(error);

        showNotification(
            "Unable to rename conversation."
        );

    }

}

/* Delete conversation */

async function deleteConversation(
    conversation
) {

    const confirmed =
        window.confirm(
            "Delete this conversation?"
        );

    if (!confirmed) {

        return;

    }

    try {

        const response =
            await fetch(
                `/api/conversations/${conversation.id}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await parseJsonResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to delete conversation."
            );

        }

        if (
            String(currentConversationId) ===
            String(conversation.id)
        ) {

            createNewChat();

        }

        await loadConversations();

    }

    catch (error) {

        console.error(error);

        showNotification(
            "Unable to delete conversation."
        );

    }

}

/* Handle file selection */

async function handleFileSelection() {

    if (!settings.fileAttachments) {

        clearAttachment();

        showNotification(
            "File attachments are disabled."
        );

        return;
    }

    const file =
        fileInput.files[0];

    if (!file) {

        return;

    }

    try {

        showNotification(
            "Processing file..."
        );

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        const response =
            await fetch(
                "/api/upload",
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await parseJsonResponse(
                response
            );

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to process file."
            );

        }

        selectedFileText =
            data.text || "";

        selectedFileName =
            data.filename ||
            file.name;

        attachmentPreview.innerHTML =
            `
            <div class="attachment-item">
                ${escapeHtml(selectedFileName)}
            </div>
            `;

        showNotification(
            "File attached."
        );

    }

    catch (error) {

        console.error(error);

        clearAttachment();

        showNotification(
            error.message ||
            "Unable to process file."
        );

    }

}

/* Clear selected attachment */

function clearAttachment() {

    selectedFileText = "";

    selectedFileName = "";

    fileInput.value = "";

    attachmentPreview.innerHTML = "";

}

/* Handle Enter key */

function handleMessageKeydown(
    event
) {

    if (event.key !== "Enter") {
        return;
    }

    if (event.shiftKey) {
        return;
    }

    if (!settings.enterToSend) {
        return;
    }

    event.preventDefault();

    sendMessage();

}

/* Resize textarea */

function resizeTextarea() {

    messageInput.style.height =
        "auto";

    messageInput.style.height =
        `${Math.min(
            messageInput.scrollHeight,
            180
        )}px`;

}

/* Typing indicator */

function showTyping() {

    typingContainer.style.display =
        "flex";

    scrollChatToBottom();

}

function hideTyping() {

    typingContainer.style.display =
        "none";

}

/* Scroll chat */

function scrollChatToBottom() {

    const chatArea =
        document.getElementById(
            "chatArea"
        );

    setTimeout(
        function() {

            chatArea.scrollTop =
                chatArea.scrollHeight;

        },
        20
    );

}

/* Theme */

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "felix-ai-theme"
        ) || "light";

    applyTheme(
        savedTheme
    );

}

function applyTheme(
    theme
) {

    document.body.classList.toggle(
        "dark",
        theme === "dark"
    );

    localStorage.setItem(
        "felix-ai-theme",
        theme
    );

    if (settingsTheme) {

        settingsTheme.value =
            theme;

    }

}

function toggleTheme() {

    const isDark =
        document.body.classList.contains(
            "dark"
        );

    applyTheme(
        isDark
            ? "light"
            : "dark"
    );

}

function handleSettingsThemeChange() {

    applyTheme(
        settingsTheme.value
    );

}

/* Settings */

function loadSettings() {

    const savedSettings =
        localStorage.getItem(
            "felix-ai-settings"
        );

    if (savedSettings) {

        try {

            const parsed =
                JSON.parse(
                    savedSettings
                );

            settings = {
                ...settings,
                ...parsed
            };

        }

        catch (error) {

            console.error(
                "Unable to load settings:",
                error
            );

        }

    }

    updateSettingsControls();

}

function saveSettings() {

    localStorage.setItem(
        "felix-ai-settings",
        JSON.stringify(settings)
    );

}

function saveSettingsFromControls() {

    settings.enterToSend =
        settingsEnterToSend.checked;

    settings.conversationHistory =
        settingsConversationHistory.checked;

    settings.fileAttachments =
        settingsFileAttachments.checked;

    saveSettings();

    if (!settings.fileAttachments) {

        clearAttachment();

    }

}

function updateSettingsControls() {

    settingsEnterToSend.checked =
        settings.enterToSend;

    settingsConversationHistory.checked =
        settings.conversationHistory;

    settingsFileAttachments.checked =
        settings.fileAttachments;

    settingsTheme.value =
        document.body.classList.contains("dark")
            ? "dark"
            : "light";

    updateCurrentModelInSettings();

}

function openSettings() {

    closeModelDropdown();

    closeSidebar();

    updateSettingsControls();

    settingsOverlay.classList.add(
        "show"
    );

    document.body.style.overflow =
        "hidden";

    settingsCloseButton.focus();

}

function closeSettings() {

    settingsOverlay.classList.remove(
        "show"
    );

    document.body.style.overflow =
        "";

    messageInput.focus();

}

function handleSettingsOverlayClick(
    event
) {

    if (
        event.target ===
        settingsOverlay
    ) {

        closeSettings();

    }

}

function updateCurrentModelInSettings() {

    if (!settingsCurrentModel) {
        return;
    }

    settingsCurrentModel.textContent =
        selectedModel.textContent.trim();

}

/* Model selection */

function selectModel(
    option
) {

    document
        .querySelectorAll(".model-option")
        .forEach(
            function(item) {

                item.classList.remove(
                    "active"
                );

            }
        );

    option.classList.add(
        "active"
    );

    selectedModel.textContent =
        option
            .querySelector("strong")
            .textContent;

    updateCurrentModelInSettings();

    closeModelDropdown();

}

function closeModelDropdown() {

    modelDropdown.classList.remove(
        "show"
    );

    modelSelectorButton.setAttribute(
        "aria-expanded",
        "false"
    );

}

/* Sidebar */

function openSidebar() {

    sidebar.classList.add(
        "open"
    );

    sidebarBackdrop.classList.add(
        "show"
    );

    document.body.classList.add(
        "sidebar-open"
    );

}

function closeSidebar() {

    sidebar.classList.remove(
        "open"
    );

    sidebarBackdrop.classList.remove(
        "show"
    );

    document.body.classList.remove(
        "sidebar-open"
    );

}

/* Notifications */

function showNotification(
    message
) {

    notification.textContent =
        message;

    notification.classList.add(
        "show"
    );

    clearTimeout(
        notificationTimer
    );

    notificationTimer =
        setTimeout(
            function() {

                notification.classList.remove(
                    "show"
                );

            },
            3000
        );

}

/* Escape HTML */

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value;

    return div.innerHTML;

}