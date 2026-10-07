"use strict";

/* =========================================================
   ELEMENT REFERENCES
========================================================= */

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

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const messagesContainer =
    document.getElementById("messagesContainer");

const welcomeScreen =
    document.getElementById("welcomeScreen");

const suggestionGrid =
    document.getElementById("suggestionGrid");

const stopButton =
    document.getElementById("stopButton");

const sendButton =
    document.getElementById("sendButton");

const fileInput =
    document.getElementById("fileInput");

const attachmentButton =
    document.getElementById("attachmentButton");

const attachedFiles =
    document.getElementById("attachedFiles");

const typingIndicator =
    document.getElementById("typingIndicator");

const modelButton =
    document.getElementById("modelButton");

const modelMenu =
    document.getElementById("modelMenu");

const currentModel =
    document.getElementById("currentModel");

const settingsOverlay =
    document.getElementById("settingsOverlay");

const settingsPanel =
    document.getElementById("settingsPanel");

const closeSettingsButton =
    document.getElementById("closeSettingsButton");


/* =========================================================
   APPLICATION STATE
========================================================= */

let currentConversation = [];

let conversations = [];

let currentConversationId = null;

let selectedFiles = [];

let isGenerating = false;

let abortController = null;

let currentModelName =
    localStorage.getItem("felixAIModel") ||
    "Felix AI";


/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);


async function initializeApp() {

    setupEventListeners();

    /*
        Set the correct initial sidebar state.

        Desktop:
        Sidebar starts open.

        Mobile:
        Sidebar starts closed.
    */

    if (window.innerWidth <= 768) {

        closeSidebar();

    } else {

        openSidebar();

    }

    loadTheme();

    loadSettings();

    await loadConversations();

    messageInput.focus();
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    /* -----------------------------------------------------
       NEW CHAT
    ----------------------------------------------------- */

    if (newChatButton) {

        newChatButton.addEventListener(
            "click",
            function () {

                createNewChat();

            }
        );

    }


    if (headerNewChatButton) {

        headerNewChatButton.addEventListener(
            "click",
            function () {

                createNewChat();

            }
        );

    }


    /* -----------------------------------------------------
       MESSAGE FORM
    ----------------------------------------------------- */

    if (messageForm) {

        messageForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();

                sendMessage();

            }
        );

    }


    /* -----------------------------------------------------
       MESSAGE INPUT
    ----------------------------------------------------- */

    if (messageInput) {

        messageInput.addEventListener(
            "input",
            function () {

                resizeTextarea();

            }
        );


        messageInput.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }


    /* -----------------------------------------------------
       SIDEBAR OPEN BUTTON
    ----------------------------------------------------- */

    if (openSidebarButton) {

        openSidebarButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                openSidebar();

            }
        );

    }


    /* -----------------------------------------------------
       SIDEBAR CLOSE BUTTON
    ----------------------------------------------------- */

    if (closeSidebarButton) {

        closeSidebarButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                event.stopPropagation();

                closeSidebar();

            }
        );

    }


    /* -----------------------------------------------------
       SIDEBAR BACKDROP
    ----------------------------------------------------- */

    if (sidebarBackdrop) {

        sidebarBackdrop.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                closeSidebar();

            }
        );

    }


    /* -----------------------------------------------------
       SEARCH
    ----------------------------------------------------- */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                filterConversations(
                    searchInput.value
                );

            }
        );

    }


    /* -----------------------------------------------------
       THEME
    ----------------------------------------------------- */

    if (themeButton) {

        themeButton.addEventListener(
            "click",
            function () {

                toggleTheme();

            }
        );

    }


    /* -----------------------------------------------------
       SETTINGS
    ----------------------------------------------------- */

    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            function () {

                openSettings();

            }
        );

    }


    if (closeSettingsButton) {

        closeSettingsButton.addEventListener(
            "click",
            function () {

                closeSettings();

            }
        );

    }


    /* -----------------------------------------------------
       SETTINGS OVERLAY
    ----------------------------------------------------- */

    if (settingsOverlay) {

        settingsOverlay.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    settingsOverlay
                ) {

                    closeSettings();

                }

            }
        );

    }


    /* -----------------------------------------------------
       FILE ATTACHMENT
    ----------------------------------------------------- */

    if (attachmentButton && fileInput) {

        attachmentButton.addEventListener(
            "click",
            function () {

                fileInput.click();

            }
        );

    }


    if (fileInput) {

        fileInput.addEventListener(
            "change",
            function () {

                handleFileSelection(
                    fileInput.files
                );

            }
        );

    }


    /* -----------------------------------------------------
       STOP GENERATION
    ----------------------------------------------------- */

    if (stopButton) {

        stopButton.addEventListener(
            "click",
            function () {

                stopGeneration();

            }
        );

    }


    /* -----------------------------------------------------
       MODEL SELECTOR
    ----------------------------------------------------- */

    if (modelButton) {

        modelButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                toggleModelMenu();

            }
        );

    }


    if (modelMenu) {

        const modelOptions =
            modelMenu.querySelectorAll(
                "[data-model]"
            );

        modelOptions.forEach(
            function (option) {

                option.addEventListener(
                    "click",
                    function () {

                        const model =
                            option.getAttribute(
                                "data-model"
                            );

                        if (model) {

                            selectModel(model);

                        }

                    }
                );

            }
        );

    }


    /* -----------------------------------------------------
       CLOSE MODEL MENU WHEN CLICKING OUTSIDE
    ----------------------------------------------------- */

    document.addEventListener(
        "click",
        function (event) {

            if (
                modelMenu &&
                modelButton &&
                !modelMenu.contains(event.target) &&
                !modelButton.contains(event.target)
            ) {

                closeModelMenu();

            }

        }
    );


    /* -----------------------------------------------------
       ESCAPE KEY
    ----------------------------------------------------- */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key !== "Escape") {

                return;

            }


            if (
                modelMenu &&
                modelMenu.classList.contains("show")
            ) {

                closeModelMenu();

                return;

            }


            if (
                settingsOverlay &&
                settingsOverlay.classList.contains("show")
            ) {

                closeSettings();

                return;

            }


            if (
                sidebar &&
                !sidebar.classList.contains("closed")
            ) {

                closeSidebar();

            }

        }
    );


    /* -----------------------------------------------------
       WINDOW RESIZE
    ----------------------------------------------------- */

    window.addEventListener(
        "resize",
        function () {

            /*
                Keep desktop and mobile states
                consistent when screen size changes.
            */

            if (window.innerWidth > 768) {

                if (
                    sidebar &&
                    sidebar.classList.contains("closed")
                ) {

                    /*
                        Keep the user's closed state.
                    */

                    return;

                }

                openSidebar();

            } else {

                /*
                    On mobile, close the sidebar
                    automatically if it was not explicitly
                    opened.
                */

                if (
                    sidebar &&
                    !sidebar.classList.contains("open")
                ) {

                    closeSidebar();

                }

            }

        }
    );

}


/* =========================================================
   SIDEBAR FUNCTIONS
========================================================= */


/*
    OPEN SIDEBAR

    This function:
    1. Removes "closed"
    2. Adds "open"
    3. Updates body state
    4. Shows the sidebar
    5. Updates accessibility attributes
*/

function openSidebar() {

    if (!sidebar) {

        return;

    }


    sidebar.classList.remove(
        "closed"
    );

    sidebar.classList.add(
        "open"
    );


    document.body.classList.remove(
        "sidebar-closed"
    );

    document.body.classList.add(
        "sidebar-open"
    );


    if (sidebarBackdrop) {

        sidebarBackdrop.classList.add(
            "show"
        );

        sidebarBackdrop.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    if (openSidebarButton) {

        openSidebarButton.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    if (closeSidebarButton) {

        closeSidebarButton.setAttribute(
            "aria-expanded",
            "true"
        );

    }


    sidebar.setAttribute(
        "aria-hidden",
        "false"
    );

}


/*
    CLOSE SIDEBAR

    This is the important fix.

    The previous version only removed "open".
    This version also adds "closed".

    That allows the CSS to actually hide the sidebar
    and display the hamburger button.
*/

function closeSidebar() {

    if (!sidebar) {

        return;

    }


    sidebar.classList.remove(
        "open"
    );

    sidebar.classList.add(
        "closed"
    );


    document.body.classList.remove(
        "sidebar-open"
    );

    document.body.classList.add(
        "sidebar-closed"
    );


    if (sidebarBackdrop) {

        sidebarBackdrop.classList.remove(
            "show"
        );

        sidebarBackdrop.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (openSidebarButton) {

        openSidebarButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    if (closeSidebarButton) {

        closeSidebarButton.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    sidebar.setAttribute(
        "aria-hidden",
        "true"
    );

}


/* =========================================================
   NEW CHAT
========================================================= */

function createNewChat() {

    currentConversation = [];

    currentConversationId = null;

    messagesContainer.innerHTML = "";

    if (welcomeScreen) {

        welcomeScreen.style.display =
            "flex";

    }

    hideTyping();

    messageInput.value = "";

    resizeTextarea();

    closeSidebar();

    messageInput.focus();

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (!messageInput) {

        return;

    }


    const message =
        messageInput.value.trim();


    if (
        !message ||
        isGenerating
    ) {

        return;

    }


    addUserMessage(message);

    messageInput.value = "";

    resizeTextarea();

    hideWelcomeScreen();

    showTyping();

    isGenerating = true;

    abortController =
        new AbortController();


    if (sendButton) {

        sendButton.disabled = true;

    }


    if (stopButton) {

        stopButton.style.display =
            "flex";

    }


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

                        conversation:
                            currentConversation,

                        model:
                            currentModelName

                    }),

                    signal:
                        abortController.signal
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to get response from server."
            );

        }


        const data =
            await response.json();


        hideTyping();


        const reply =
            data.response ||
            data.message ||
            "I could not generate a response.";


        addAssistantMessage(reply);


        currentConversation.push({

            role: "user",

            content: message

        });


        currentConversation.push({

            role: "assistant",

            content: reply

        });


        await saveCurrentConversation();


    } catch (error) {

        hideTyping();


        if (
            error.name !==
            "AbortError"
        ) {

            addAssistantMessage(
                "Sorry, something went wrong while processing your message."
            );

            console.error(
                "Chat error:",
                error
            );

        }

    } finally {

        isGenerating = false;

        abortController = null;


        if (sendButton) {

            sendButton.disabled = false;

        }


        if (stopButton) {

            stopButton.style.display =
                "none";

        }

    }

}


/* =========================================================
   USER MESSAGE
========================================================= */

function addUserMessage(message) {

    if (!messagesContainer) {

        return;

    }


    const messageElement =
        document.createElement("div");


    messageElement.className =
        "message user";


    const content =
        document.createElement("div");


    content.className =
        "message-content";


    content.textContent =
        message;


    messageElement.appendChild(
        content
    );


    messagesContainer.appendChild(
        messageElement
    );


    scrollMessagesToBottom();

}


/* =========================================================
   ASSISTANT MESSAGE
========================================================= */

function addAssistantMessage(message) {

    if (!messagesContainer) {

        return;

    }


    const messageElement =
        document.createElement("div");


    messageElement.className =
        "message assistant";


    const content =
        document.createElement("div");


    content.className =
        "message-content";


    content.textContent =
        message;


    messageElement.appendChild(
        content
    );


    messagesContainer.appendChild(
        messageElement
    );


    scrollMessagesToBottom();

}


/* =========================================================
   SCROLL MESSAGES
========================================================= */

function scrollMessagesToBottom() {

    if (!messagesContainer) {

        return;

    }


    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

}


/* =========================================================
   WELCOME SCREEN
========================================================= */

function hideWelcomeScreen() {

    if (welcomeScreen) {

        welcomeScreen.style.display =
            "none";

    }

}


/* =========================================================
   TYPING INDICATOR
========================================================= */

function showTyping() {

    if (typingIndicator) {

        typingIndicator.style.display =
            "flex";

    }

}


function hideTyping() {

    if (typingIndicator) {

        typingIndicator.style.display =
            "none";

    }

}


/* =========================================================
   STOP GENERATION
========================================================= */

function stopGeneration() {

    if (abortController) {

        abortController.abort();

    }


    isGenerating = false;

    hideTyping();


    if (sendButton) {

        sendButton.disabled = false;

    }


    if (stopButton) {

        stopButton.style.display =
            "none";

    }

}


/* =========================================================
   TEXTAREA RESIZE
========================================================= */

function resizeTextarea() {

    if (!messageInput) {

        return;

    }


    messageInput.style.height =
        "auto";


    messageInput.style.height =
        messageInput.scrollHeight +
        "px";

}


/* =========================================================
   FILE HANDLING
========================================================= */

function handleFileSelection(files) {

    if (!files) {

        return;

    }


    selectedFiles =
        Array.from(files);


    displayAttachedFiles();

}


function displayAttachedFiles() {

    if (!attachedFiles) {

        return;

    }


    attachedFiles.innerHTML = "";


    selectedFiles.forEach(
        function (file, index) {

            const fileElement =
                document.createElement("div");


            fileElement.className =
                "attached-file";


            fileElement.innerHTML = `
                <span>${escapeHtml(file.name)}</span>
                <button
                    type="button"
                    data-index="${index}"
                    aria-label="Remove file"
                >
                    ×
                </button>
            `;


            const removeButton =
                fileElement.querySelector(
                    "button"
                );


            removeButton.addEventListener(
                "click",
                function () {

                    selectedFiles.splice(
                        index,
                        1
                    );

                    displayAttachedFiles();

                }
            );


            attachedFiles.appendChild(
                fileElement
            );

        }
    );

}


/* =========================================================
   MODEL MENU
========================================================= */

function toggleModelMenu() {

    if (!modelMenu) {

        return;

    }


    modelMenu.classList.toggle(
        "show"
    );

}


function closeModelMenu() {

    if (!modelMenu) {

        return;

    }


    modelMenu.classList.remove(
        "show"
    );

}


function selectModel(model) {

    currentModelName =
        model;


    localStorage.setItem(
        "felixAIModel",
        model
    );


    if (currentModel) {

        currentModel.textContent =
            model;

    }


    closeModelMenu();

}


/* =========================================================
   SETTINGS
========================================================= */

function openSettings() {

    if (!settingsOverlay) {

        return;

    }


    settingsOverlay.classList.add(
        "show"
    );

}


function closeSettings() {

    if (!settingsOverlay) {

        return;

    }


    settingsOverlay.classList.remove(
        "show"
    );

}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "felixAITheme"
        );


    if (
        savedTheme ===
        "dark"
    ) {

        document.body.classList.add(
            "dark-theme"
        );

    } else {

        document.body.classList.remove(
            "dark-theme"
        );

    }

}


function toggleTheme() {

    document.body.classList.toggle(
        "dark-theme"
    );


    const isDark =
        document.body.classList.contains(
            "dark-theme"
        );


    localStorage.setItem(
        "felixAITheme",
        isDark
            ? "dark"
            : "light"
    );

}


/* =========================================================
   SETTINGS STORAGE
========================================================= */

function loadSettings() {

    if (currentModel) {

        currentModel.textContent =
            currentModelName;

    }

}


/* =========================================================
   CONVERSATIONS
========================================================= */

async function loadConversations() {

    try {

        const response =
            await fetch(
                "/api/conversations"
            );


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        conversations =
            Array.isArray(data)
                ? data
                : data.conversations || [];


        displayConversations(
            conversations
        );


    } catch (error) {

        console.error(
            "Could not load conversations:",
            error
        );

    }

}


/* =========================================================
   DISPLAY CONVERSATIONS
========================================================= */

function displayConversations(
    conversationData
) {

    if (!conversationList) {

        return;

    }


    conversationList.innerHTML = "";


    conversationData.forEach(
        function (conversation) {

            const item =
                document.createElement("div");


            item.className =
                "conversation-item";


            item.dataset.id =
                conversation.id;


            const title =
                conversation.title ||
                "New conversation";


            item.innerHTML = `
                <span class="conversation-title">
                    ${escapeHtml(title)}
                </span>
            `;


            item.addEventListener(
                "click",
                function () {

                    loadConversation(
                        conversation.id
                    );

                }
            );


            conversationList.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   LOAD SINGLE CONVERSATION
========================================================= */

async function loadConversation(id) {

    try {

        const response =
            await fetch(
                `/api/conversations/${id}`
            );


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        currentConversationId =
            id;


        currentConversation =
            data.messages ||
            data.conversation ||
            [];


        messagesContainer.innerHTML =
            "";


        if (
            !currentConversation.length
        ) {

            if (welcomeScreen) {

                welcomeScreen.style.display =
                    "flex";

            }

            return;

        }


        hideWelcomeScreen();


        currentConversation.forEach(
            function (message) {

                if (
                    message.role ===
                    "user"
                ) {

                    addUserMessage(
                        message.content
                    );

                } else {

                    addAssistantMessage(
                        message.content
                    );

                }

            }
        );


        if (window.innerWidth <= 768) {

            closeSidebar();

        }


    } catch (error) {

        console.error(
            "Could not load conversation:",
            error
        );

    }

}


/* =========================================================
   SAVE CURRENT CONVERSATION
========================================================= */

async function saveCurrentConversation() {

    if (
        !currentConversation.length
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                "/api/conversations",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        id:
                            currentConversationId,

                        messages:
                            currentConversation

                    })

                }
            );


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        if (data.id) {

            currentConversationId =
                data.id;

        }


        await loadConversations();


    } catch (error) {

        console.error(
            "Could not save conversation:",
            error
        );

    }

}


/* =========================================================
   SEARCH CONVERSATIONS
========================================================= */

function filterConversations(
    searchTerm
) {

    const term =
        searchTerm
            .trim()
            .toLowerCase();


    if (!term) {

        displayConversations(
            conversations
        );

        return;

    }


    const filtered =
        conversations.filter(
            function (conversation) {

                const title =
                    (
                        conversation.title ||
                        ""
                    ).toLowerCase();


                return title.includes(
                    term
                );

            }
        );


    displayConversations(
        filtered
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value;


    return div.innerHTML;

}