/*
   GLOBAL STATE
*/

let currentConversation = [];

let currentConversationId = null;

let currentConversationTitle = null;

let currentModelName = "felix-ai";

let attachedFiles = [];

let currentAbortController = null;

let conversations = [];

let deletedConversationIds = [];

let renamedConversationTitles = {};


/*
   DOM ELEMENTS
*/

const sidebar =
    document.getElementById("sidebar");

const sidebarBackdrop =
    document.getElementById("sidebarBackdrop");

const newChatButton =
    document.getElementById("newChatButton");

const openSidebarButton =
    document.getElementById("openSidebarButton");

const closeSidebarButton =
    document.getElementById("closeSidebarButton");

const messagesContainer =
    document.getElementById("messagesContainer");

const welcomeScreen =
    document.getElementById("welcomeScreen");

const typingIndicator =
    document.getElementById("typingIndicator");

const messageForm =
    document.getElementById("messageForm");

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

const suggestionGrid =
    document.getElementById("suggestionGrid");

const searchInput =
    document.getElementById("searchInput");

const conversationList =
    document.getElementById("conversationList");

const emptyConversationState =
    document.getElementById("emptyConversationState");

const themeButton =
    document.getElementById("themeButton");

const settingsButton =
    document.getElementById("settingsButton");

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

const modelSelectorButton =
    document.getElementById(
        "modelSelectorButton"
    );

const modelDropdown =
    document.getElementById(
        "modelDropdown"
    );

const selectedModel =
    document.getElementById(
        "selectedModel"
    );


/*
   START APPLICATION
*/

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadConversationManagementState();

        setupSidebar();

        setupNewChat();

        setupTextarea();

        setupMessageForm();

        setupSuggestionButtons();

        setupAttachments();

        setupModelSelector();

        setupSearch();

        setupTheme();

        setupSettings();

        loadConversations();

        updateSendButton();

    }
);


/*
   SIDEBAR
*/

function setupSidebar() {

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


    if (sidebarBackdrop) {

        sidebarBackdrop.addEventListener(
            "click",
            function () {

                closeSidebar();

            }
        );

    }

}


function openSidebar() {

    if (!sidebar) return;

    sidebar.classList.remove("closed");

    sidebar.classList.add("open");

    if (sidebarBackdrop) {

        sidebarBackdrop.classList.add("show");

    }

}


function closeSidebar() {

    if (!sidebar) return;

    sidebar.classList.remove("open");

    sidebar.classList.add("closed");

    if (sidebarBackdrop) {

        sidebarBackdrop.classList.remove("show");

    }

}


/*
   NEW CHAT
*/

function setupNewChat() {

    if (!newChatButton) return;

    newChatButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            createNewChat();

        }
    );

}


function createNewChat() {

    if (currentAbortController) {

        currentAbortController.abort();

        currentAbortController = null;

    }


    currentConversation = [];

    currentConversationId = null;

    currentConversationTitle = null;


    if (messagesContainer) {

        messagesContainer.innerHTML = "";

    }


    if (welcomeScreen) {

        welcomeScreen.style.display = "flex";

    }


    hideTyping();


    if (messageInput) {

        messageInput.value = "";

        resizeTextarea();

    }


    attachedFiles = [];


    if (attachmentPreview) {

        attachmentPreview.innerHTML = "";

    }


    if (fileInput) {

        fileInput.value = "";

    }


    if (sendButton) {

        sendButton.style.display = "flex";

    }


    if (stopButton) {

        stopButton.style.display = "none";

    }


    updateSendButton();

    renderConversationList(conversations);


    if (window.innerWidth <= 767) {

        closeSidebar();

    }

}


/*
   TEXTAREA
*/

function setupTextarea() {

    if (!messageInput) return;


    messageInput.addEventListener(
        "input",
        function () {

            resizeTextarea();

            updateSendButton();

        }
    );


    messageInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                settingsEnterToSend &&
                settingsEnterToSend.checked
            ) {

                event.preventDefault();

                sendMessage();

            }

        }
    );

}


function resizeTextarea() {

    if (!messageInput) return;

    messageInput.style.height = "auto";

    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            180
        ) + "px";

}


/*
   MESSAGE FORM
*/

function setupMessageForm() {

    if (!messageForm) return;

    messageForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            sendMessage();

        }
    );

}


/*
   SEND BUTTON
*/

function updateSendButton() {

    if (!sendButton || !messageInput) return;

    const hasText =
        messageInput.value.trim().length > 0;

    sendButton.disabled = !hasText;

    sendButton.style.opacity =
        hasText ? "1" : "0.5";

}


/*
   SEND MESSAGE
*/

async function sendMessage() {

    if (!messageInput) return;


    const message =
        messageInput.value.trim();


    if (!message) return;


    if (currentConversation.length === 0) {

        currentConversationTitle =
            createConversationTitle(message);

    }


    if (welcomeScreen) {

        welcomeScreen.style.display = "none";

    }


    addUserMessage(message);


    currentConversation.push({
        role: "user",
        content: message
    });


    messageInput.value = "";

    resizeTextarea();

    updateSendButton();


    await saveCurrentConversation();


    renderConversationList(conversations);


    showTyping();


    currentAbortController =
        new AbortController();


    if (stopButton) {

        stopButton.style.display = "flex";

    }


    if (sendButton) {

        sendButton.style.display = "none";

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
                        currentAbortController.signal

                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to contact the AI server."
            );

        }


        const data =
            await response.json();


        hideTyping();


        const assistantMessage =
            data.response ||
            data.message ||
            data.reply ||
            "I was unable to generate a response.";


        addAssistantMessage(
            assistantMessage
        );


        currentConversation.push({

            role: "assistant",

            content: assistantMessage

        });


        await saveCurrentConversation();


        await loadConversations();


    } catch (error) {

        hideTyping();


        if (
            error.name !== "AbortError"
        ) {

            console.error(
                "Chat error:",
                error
            );


            addAssistantMessage(
                "Sorry, something went wrong while processing your request."
            );

        }

    } finally {

        currentAbortController = null;


        if (stopButton) {

            stopButton.style.display =
                "none";

        }


        if (sendButton) {

            sendButton.style.display =
                "flex";

        }


        updateSendButton();

    }

}


/*
   CREATE CONVERSATION TITLE
*/

function createConversationTitle(message) {

    let title =
        message.trim();


    title =
        title.replace(
            /\s+/g,
            " "
        );


    if (title.length > 50) {

        title =
            title.substring(
                0,
                50
            ).trim() + "...";

    }


    return title;

}


/*
   CONVERSATION MANAGEMENT STATE
*/

function loadConversationManagementState() {

    try {

        const deleted =
            localStorage.getItem(
                "felix_ai_deleted_conversations"
            );


        if (deleted) {

            const parsed =
                JSON.parse(deleted);


            if (Array.isArray(parsed)) {

                deletedConversationIds =
                    parsed;

            }

        }


        const renamed =
            localStorage.getItem(
                "felix_ai_renamed_conversations"
            );


        if (renamed) {

            const parsed =
                JSON.parse(renamed);


            if (
                parsed &&
                typeof parsed === "object"
            ) {

                renamedConversationTitles =
                    parsed;

            }

        }

    } catch (error) {

        console.warn(
            "Unable to load conversation management state.",
            error
        );

    }

}


function saveConversationManagementState() {

    try {

        localStorage.setItem(
            "felix_ai_deleted_conversations",
            JSON.stringify(
                deletedConversationIds
            )
        );


        localStorage.setItem(
            "felix_ai_renamed_conversations",
            JSON.stringify(
                renamedConversationTitles
            )
        );

    } catch (error) {

        console.warn(
            "Unable to save conversation management state.",
            error
        );

    }

}


/*
   CONVERSATION ID
*/

function getConversationIdentifier(
    conversation
) {

    if (!conversation) return null;


    return (
        conversation.id ??
        conversation.localId ??
        null
    );

}


/*
   CHECK DELETED CONVERSATION
*/

function isConversationDeleted(
    conversation
) {

    const id =
        getConversationIdentifier(
            conversation
        );


    if (id === null) return false;


    return deletedConversationIds.some(
        function (deletedId) {

            return String(deletedId) ===
                String(id);

        }
    );

}


/*
   GET RENAMED TITLE
*/

function getStoredConversationTitle(
    conversation
) {

    const id =
        getConversationIdentifier(
            conversation
        );


    if (id === null) {

        return null;

    }


    return (
        renamedConversationTitles[
            String(id)
        ] || null
    );

}


/*
   APPLY LOCAL CHANGES
*/

function applyConversationManagement(
    conversationListData
) {

    if (!Array.isArray(
        conversationListData
    )) {

        return [];

    }


    return conversationListData
        .filter(
            function (conversation) {

                return !isConversationDeleted(
                    conversation
                );

            }
        )
        .map(
            function (conversation) {

                const renamedTitle =
                    getStoredConversationTitle(
                        conversation
                    );


                if (renamedTitle) {

                    return {
                        ...conversation,
                        title:
                            renamedTitle
                    };

                }


                return conversation;

            }
        );

}


/*
   SAVE CURRENT CONVERSATION
*/

async function saveCurrentConversation() {

    if (
        !settingsConversationHistory ||
        !settingsConversationHistory.checked
    ) {

        return;

    }


    if (
        !currentConversation ||
        currentConversation.length === 0
    ) {

        return;

    }


    const temporaryConversation = {

        id: currentConversationId,

        title:
            currentConversationTitle ||
            createConversationTitle(
                currentConversation[0].content
            ),

        conversation:
            currentConversation,

        updated_at:
            new Date().toISOString()

    };


    if (!currentConversationId) {

        temporaryConversation.localId =
            "local-" + Date.now();

        temporaryConversation.id =
            temporaryConversation.localId;

        currentConversationId =
            temporaryConversation.id;

        conversations.unshift(
            temporaryConversation
        );

    } else {

        const existingIndex =
            conversations.findIndex(
                function (conversation) {

                    return String(
                        conversation.id
                    ) === String(
                        currentConversationId
                    );

                }
            );


        if (existingIndex >= 0) {

            conversations[
                existingIndex
            ] = {

                ...conversations[
                    existingIndex
                ],

                title:
                    temporaryConversation.title,

                conversation:
                    currentConversation,

                updated_at:
                    temporaryConversation.updated_at

            };

        } else {

            conversations.unshift(
                temporaryConversation
            );

        }

    }


    conversations =
        applyConversationManagement(
            conversations
        );


    saveLocalConversations();

    renderConversationList(
        conversations
    );


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
                            isLocalConversationId(
                                currentConversationId
                            )
                                ? null
                                : currentConversationId,

                        title:
                            currentConversationTitle,

                        conversation:
                            currentConversation

                    })

                }
            );


        if (!response.ok) {

            console.warn(
                "Conversation API did not accept the save request."
            );

            return;

        }


        const data =
            await response.json();


        if (data.id) {

            const oldId =
                currentConversationId;


            currentConversationId =
                data.id;


            const index =
                conversations.findIndex(
                    function (conversation) {

                        return String(
                            conversation.id
                        ) === String(oldId);

                    }
                );


            if (index >= 0) {

                conversations[index].id =
                    data.id;

            }


            saveLocalConversations();

            renderConversationList(
                conversations
            );

        }

    } catch (error) {

        console.warn(
            "Conversation backend save failed. Local history retained.",
            error
        );

    }

}


/*
   LOCAL CONVERSATION BACKUP
*/

function saveLocalConversations() {

    try {

        localStorage.setItem(
            "felix_ai_conversations",
            JSON.stringify(
                conversations
            )
        );

    } catch (error) {

        console.warn(
            "Unable to save local conversation history.",
            error
        );

    }

}


function loadLocalConversations() {

    try {

        const saved =
            localStorage.getItem(
                "felix_ai_conversations"
            );


        if (!saved) return [];


        const parsed =
            JSON.parse(saved);


        if (Array.isArray(parsed)) {

            return applyConversationManagement(
                parsed
            );

        }

    } catch (error) {

        console.warn(
            "Unable to read local conversation history.",
            error
        );

    }


    return [];

}


/*
   LOAD CONVERSATIONS
*/

async function loadConversations() {

    const localHistory =
        loadLocalConversations();


    if (localHistory.length > 0) {

        conversations =
            localHistory;

        renderConversationList(
            conversations
        );

    }


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


        let serverConversations = [];


        if (Array.isArray(data)) {

            serverConversations =
                data;

        } else if (
            Array.isArray(
                data.conversations
            )
        ) {

            serverConversations =
                data.conversations;

        } else if (
            Array.isArray(
                data.results
            )
        ) {

            serverConversations =
                data.results;

        }


        serverConversations =
            applyConversationManagement(
                serverConversations
            );


        conversations =
            mergeConversations(
                serverConversations,
                localHistory
            );


        conversations =
            applyConversationManagement(
                conversations
            );


        saveLocalConversations();

        renderConversationList(
            conversations
        );


    } catch (error) {

        console.warn(
            "Unable to load server conversation history. Using local history.",
            error
        );


        renderConversationList(
            conversations
        );

    }

}


/*
   MERGE CONVERSATIONS
*/

function mergeConversations(
    serverList,
    localList
) {

    const merged = [];


    serverList.forEach(
        function (serverConversation) {

            if (!serverConversation) return;

            merged.push(
                serverConversation
            );

        }
    );


    localList.forEach(
        function (localConversation) {

            if (!localConversation) return;


            const localId =
                getConversationIdentifier(
                    localConversation
                );


            const alreadyExists =
                merged.some(
                    function (
                        serverConversation
                    ) {

                        const serverId =
                            getConversationIdentifier(
                                serverConversation
                            );


                        return (
                            serverId !== null &&
                            localId !== null &&
                            String(serverId) ===
                                String(localId)
                        );

                    }
                );


            if (!alreadyExists) {

                merged.push(
                    localConversation
                );

            }

        }
    );


    merged.sort(
        function (a, b) {

            const dateA =
                new Date(
                    a.updated_at ||
                    a.updatedAt ||
                    0
                );


            const dateB =
                new Date(
                    b.updated_at ||
                    b.updatedAt ||
                    0
                );


            return dateB - dateA;

        }
    );


    return merged;

}


/*
   RENDER CONVERSATION LIST
*/

function renderConversationList(
    conversationData
) {

    if (!conversationList) return;


    conversationList.innerHTML = "";


    const validConversations =
        applyConversationManagement(
            Array.isArray(
                conversationData
            )
                ? conversationData
                : []
        ).filter(
            function (conversation) {

                return (
                    conversation &&
                    (
                        conversation.conversation ||
                        conversation.messages
                    )
                );

            }
        );


    if (
        validConversations.length === 0
    ) {

        if (emptyConversationState) {

            emptyConversationState.style.display =
                "block";

        }

        return;

    }


    if (emptyConversationState) {

        emptyConversationState.style.display =
            "none";

    }


    validConversations.forEach(
        function (conversation) {

            createConversationItem(
                conversation
            );

        }
    );

}


/*
   CREATE CONVERSATION ITEM
*/

function createConversationItem(
    conversation
) {

    const item =
        document.createElement("div");


    item.className =
        "conversation-item";


    const conversationId =
        getConversationIdentifier(
            conversation
        );


    if (
        String(conversationId) ===
        String(currentConversationId)
    ) {

        item.classList.add("active");

    }


    /* TITLE */

    const titleElement =
        document.createElement("div");


    titleElement.className =
        "conversation-title";


    titleElement.textContent =
        conversation.title ||
        getConversationTitle(
            conversation
        );


    /* ACTIONS */

    const actions =
        document.createElement("div");


    actions.className =
        "conversation-actions";


    /* THREE DOT BUTTON */

    const menuButton =
        document.createElement("button");


    menuButton.type =
        "button";


    menuButton.className =
        "conversation-menu-button";


    menuButton.setAttribute(
        "aria-label",
        "Conversation options"
    );


    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );


    menuButton.textContent =
        "⋯";


    /* MENU */

    const menu =
        document.createElement("div");


    menu.className =
        "conversation-menu";


    /* RENAME */

    const renameButton =
        document.createElement("button");


    renameButton.type =
        "button";


    renameButton.className =
        "conversation-menu-item";


    renameButton.textContent =
        "Rename";


    renameButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            menu.classList.remove(
                "show"
            );

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            startRenameConversation(
                conversation,
                item,
                titleElement
            );

        }
    );


    /* DELETE */

    const deleteButton =
        document.createElement("button");


    deleteButton.type =
        "button";


    deleteButton.className =
        "conversation-menu-item delete";


    deleteButton.textContent =
        "Delete";


    deleteButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            menu.classList.remove(
                "show"
            );

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            deleteConversation(
                conversation
            );

        }
    );


    menu.appendChild(
        renameButton
    );


    menu.appendChild(
        deleteButton
    );


    /* MENU BUTTON */

    menuButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();

            closeAllConversationMenus(
                menu
            );


            const isOpen =
                menu.classList.toggle(
                    "show"
                );


            menuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );


    /* CONVERSATION CLICK */

    item.addEventListener(
        "click",
        function (event) {

            if (
                event.target.closest(
                    ".conversation-actions"
                )
            ) {

                return;

            }


            loadConversation(
                conversationId
            );

        }
    );


    actions.appendChild(
        menuButton
    );


    actions.appendChild(
        menu
    );


    item.appendChild(
        titleElement
    );


    item.appendChild(
        actions
    );


    conversationList.appendChild(
        item
    );

}


/*
   CLOSE CONVERSATION MENUS
*/

function closeAllConversationMenus(
    exceptMenu = null
) {

    const menus =
        document.querySelectorAll(
            ".conversation-menu.show"
        );


    menus.forEach(
        function (menu) {

            if (menu !== exceptMenu) {

                menu.classList.remove(
                    "show"
                );


                const button =
                    menu.parentElement
                        ?.querySelector(
                            ".conversation-menu-button"
                        );


                if (button) {

                    button.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }

            }

        }
    );

}


/*
   RENAME CONVERSATION
*/

function startRenameConversation(
    conversation,
    item,
    titleElement
) {

    if (
        item.querySelector(
            ".conversation-rename-input"
        )
    ) {

        return;

    }


    const oldTitle =
        titleElement.textContent;


    const input =
        document.createElement("input");


    input.type =
        "text";


    input.className =
        "conversation-rename-input";


    input.value =
        oldTitle;


    input.maxLength = 100;


    titleElement.replaceWith(
        input
    );


    input.focus();

    input.select();


    let finished = false;


    function finishRename(
        saveChanges
    ) {

        if (finished) return;

        finished = true;


        const newTitle =
            input.value.trim();


        const finalTitle =
            saveChanges && newTitle
                ? newTitle
                : oldTitle;


        titleElement.textContent =
            finalTitle;


        input.replaceWith(
            titleElement
        );


        if (
            saveChanges &&
            newTitle &&
            newTitle !== oldTitle
        ) {

            saveRenamedConversation(
                conversation,
                newTitle
            );

        }

    }


    input.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                finishRename(true);

            }


            if (event.key === "Escape") {

                event.preventDefault();

                finishRename(false);

            }

        }
    );


    input.addEventListener(
        "blur",
        function () {

            finishRename(true);

        }
    );

}


/*
   SAVE RENAMED CONVERSATION
*/

async function saveRenamedConversation(
    conversation,
    newTitle
) {

    const conversationId =
        getConversationIdentifier(
            conversation
        );


    if (conversationId === null) {

        return;

    }


    renamedConversationTitles[
        String(conversationId)
    ] = newTitle;


    conversation.title =
        newTitle;


    if (
        String(conversationId) ===
        String(currentConversationId)
    ) {

        currentConversationTitle =
            newTitle;

    }


    saveConversationManagementState();


    saveLocalConversations();


    renderConversationList(
        conversations
    );


    /*
       Try the server endpoint if it exists.

       The current backend may not yet have
       a PATCH route, so failure here is harmless.
    */

    if (
        !isLocalConversationId(
            conversationId
        )
    ) {

        try {

            const response =
                await fetch(
                    `/api/conversations/${conversationId}`,
                    {

                        method: "PATCH",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            title: newTitle
                        })

                    }
                );


            if (!response.ok) {

                console.warn(
                    "Server rename endpoint is not available. Local rename retained."
                );

            }

        } catch (error) {

            console.warn(
                "Unable to update conversation title on server. Local rename retained.",
                error
            );

        }

    }

}


/*
   DELETE CONVERSATION
*/

async function deleteConversation(
    conversation
) {

    const conversationId =
        getConversationIdentifier(
            conversation
        );


    if (conversationId === null) {

        return;

    }


    const title =
        conversation.title ||
        getConversationTitle(
            conversation
        );


    const confirmed =
        window.confirm(
            `Delete "${title}"?\n\nThis conversation will be removed from your Felix AI history.`
        );


    if (!confirmed) {

        return;

    }


    /* SAVE DELETE STATE */

    deletedConversationIds =
        deletedConversationIds.filter(
            function (id) {

                return String(id) !==
                    String(conversationId);

            }
        );


    deletedConversationIds.push(
        conversationId
    );


    delete renamedConversationTitles[
        String(conversationId)
    ];


    saveConversationManagementState();


    /* REMOVE FROM CURRENT ARRAY */

    conversations =
        conversations.filter(
            function (item) {

                const itemId =
                    getConversationIdentifier(
                        item
                    );


                return (
                    String(itemId) !==
                    String(conversationId)
                );

            }
        );


    saveLocalConversations();


    /*
       If the user deleted the conversation
       currently being viewed, start a new chat.
    */

    if (
        String(currentConversationId) ===
        String(conversationId)
    ) {

        createNewChat();

    }


    renderConversationList(
        conversations
    );


    /*
       Try deleting it from the server too.
       If the backend does not support DELETE,
       the local deletion remains active.
    */

    if (
        !isLocalConversationId(
            conversationId
        )
    ) {

        try {

            const response =
                await fetch(
                    `/api/conversations/${conversationId}`,
                    {
                        method: "DELETE"
                    }
                );


            if (!response.ok) {

                console.warn(
                    "Server delete endpoint is not available. Local deletion retained."
                );

            }

        } catch (error) {

            console.warn(
                "Unable to delete conversation from server. Local deletion retained.",
                error
            );

        }

    }

}


/*
   GET CONVERSATION TITLE
*/

function getConversationTitle(
    conversation
) {

    const messages =
        conversation.conversation ||
        conversation.messages ||
        [];


    if (
        !Array.isArray(messages) ||
        messages.length === 0
    ) {

        return "New Conversation";

    }


    const firstUserMessage =
        messages.find(
            function (message) {

                return (
                    message.role === "user"
                );

            }
        );


    if (
        firstUserMessage &&
        firstUserMessage.content
    ) {

        return createConversationTitle(
            firstUserMessage.content
        );

    }


    return "New Conversation";

}


/*
   CHECK LOCAL ID
*/

function isLocalConversationId(id) {

    return (
        typeof id === "string" &&
        id.startsWith("local-")
    );

}


/*
   LOAD ONE CONVERSATION
*/

async function loadConversation(id) {

    const localConversation =
        conversations.find(
            function (conversation) {

                return String(
                    getConversationIdentifier(
                        conversation
                    )
                ) === String(id);

            }
        );


    if (
        localConversation &&
        isLocalConversationId(id)
    ) {

        displayConversation(
            localConversation
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/api/conversations/${id}`
            );


        if (!response.ok) {

            throw new Error(
                "Unable to load conversation."
            );

        }


        const data =
            await response.json();


        displayConversation(
            data
        );


    } catch (error) {

        if (localConversation) {

            displayConversation(
                localConversation
            );

        } else {

            console.error(
                "Unable to load conversation:",
                error
            );

        }

    }

}


/*
   DISPLAY CONVERSATION
*/

function displayConversation(
    conversationData
) {

    const messages =
        conversationData.conversation ||
        conversationData.messages ||
        [];


    if (!Array.isArray(messages)) {

        return;

    }


    currentConversationId =
        conversationData.id ||
        conversationData.localId;


    currentConversationTitle =
        getStoredConversationTitle(
            conversationData
        ) ||
        conversationData.title ||
        getConversationTitle(
            conversationData
        );


    currentConversation =
        JSON.parse(
            JSON.stringify(messages)
        );


    if (messagesContainer) {

        messagesContainer.innerHTML = "";

    }


    if (welcomeScreen) {

        welcomeScreen.style.display =
            "none";

    }


    currentConversation.forEach(
        function (message) {

            if (
                message.role === "user"
            ) {

                addUserMessage(
                    message.content
                );

            } else if (
                message.role === "assistant"
            ) {

                addAssistantMessage(
                    message.content
                );

            }

        }
    );


    renderConversationList(
        conversations
    );


    if (
        window.innerWidth <= 767
    ) {

        closeSidebar();

    }


    scrollToBottom();

}


/*
   USER MESSAGE
*/

function addUserMessage(message) {

    if (!messagesContainer) return;


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


    scrollToBottom();

}


/*
   ASSISTANT MESSAGE
*/

function addAssistantMessage(
    message
) {

    if (!messagesContainer) return;


    const messageElement =
        document.createElement("div");


    messageElement.className =
        "message assistant";


    const avatar =
        document.createElement("div");


    avatar.className =
        "typing-avatar";


    avatar.textContent =
        "F";


    const content =
        document.createElement("div");


    content.className =
        "message-content";


    content.textContent =
        message;


    messageElement.appendChild(
        avatar
    );


    messageElement.appendChild(
        content
    );


    messagesContainer.appendChild(
        messageElement
    );


    scrollToBottom();

}


/*
   SCROLL
*/

function scrollToBottom() {

    if (!messagesContainer) return;

    messagesContainer.scrollTop =
        messagesContainer.scrollHeight;

}


/*
   TYPING
*/

function showTyping() {

    if (!typingIndicator) return;

    typingIndicator.style.display =
        "flex";

    scrollToBottom();

}


function hideTyping() {

    if (!typingIndicator) return;

    typingIndicator.style.display =
        "none";

}


/*
   STOP
*/

if (stopButton) {

    stopButton.addEventListener(
        "click",
        function () {

            if (currentAbortController) {

                currentAbortController.abort();

                currentAbortController = null;

            }


            hideTyping();


            stopButton.style.display =
                "none";


            if (sendButton) {

                sendButton.style.display =
                    "flex";

            }

        }
    );

}


/*
   SUGGESTIONS
*/

function setupSuggestionButtons() {

    if (!suggestionGrid) return;


    const buttons =
        suggestionGrid.querySelectorAll(
            ".suggestion-card"
        );


    buttons.forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    if (!messageInput) return;


                    messageInput.value =
                        button.dataset.suggestion ||
                        "";


                    resizeTextarea();

                    updateSendButton();

                    messageInput.focus();

                }
            );

        }
    );

}


/*
   ATTACHMENTS
*/

function setupAttachments() {

    if (
        !attachmentButton ||
        !fileInput
    ) {

        return;

    }


    attachmentButton.addEventListener(
        "click",
        function () {

            if (
                settingsFileAttachments &&
                !settingsFileAttachments.checked
            ) {

                return;

            }


            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        function () {

            attachedFiles =
                Array.from(
                    fileInput.files
                );


            displayAttachedFiles();

        }
    );

}


function displayAttachedFiles() {

    if (!attachmentPreview) return;


    attachmentPreview.innerHTML = "";


    attachedFiles.forEach(
        function (file) {

            const item =
                document.createElement("div");


            item.className =
                "attachment-item";


            item.textContent =
                file.name;


            attachmentPreview.appendChild(
                item
            );

        }
    );

}


/*
   MODEL SELECTOR
*/

function setupModelSelector() {

    if (
        !modelSelectorButton ||
        !modelDropdown
    ) {

        return;

    }


    modelSelectorButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            const isOpen =
                modelDropdown.classList.toggle(
                    "show"
                );


            modelSelectorButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );


    const options =
        modelDropdown.querySelectorAll(
            ".model-option"
        );


    options.forEach(
        function (option) {

            option.addEventListener(
                "click",
                function () {

                    currentModelName =
                        option.dataset.model;


                    const modelName =
                        option.textContent.trim();


                    if (selectedModel) {

                        selectedModel.textContent =
                            modelName;

                    }


                    if (settingsCurrentModel) {

                        settingsCurrentModel.textContent =
                            modelName;

                    }


                    options.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    option.classList.add(
                        "active"
                    );


                    modelDropdown.classList.remove(
                        "show"
                    );


                    modelSelectorButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                }
            );

        }
    );


    document.addEventListener(
        "click",
        function () {

            modelDropdown.classList.remove(
                "show"
            );


            modelSelectorButton.setAttribute(
                "aria-expanded",
                "false"
            );

        }
    );

}


/*
   SEARCH
*/

function setupSearch() {

    if (!searchInput) return;


    searchInput.addEventListener(
        "input",
        function () {

            const searchTerm =
                searchInput.value
                    .trim()
                    .toLowerCase();


            const items =
                conversationList.querySelectorAll(
                    ".conversation-item"
                );


            items.forEach(
                function (item) {

                    const title =
                        item.textContent
                            .toLowerCase();


                    item.style.display =
                        title.includes(
                            searchTerm
                        )
                            ? "flex"
                            : "none";

                }
            );

        }
    );

}


/*
   THEME
*/

function setupTheme() {

    const savedTheme =
        localStorage.getItem(
            "felixTheme"
        );


    if (
        savedTheme === "dark"
    ) {

        document.body.classList.add(
            "dark"
        );


        if (settingsTheme) {

            settingsTheme.checked =
                true;

        }

    }


    if (themeButton) {

        themeButton.addEventListener(
            "click",
            toggleTheme
        );

    }


    if (settingsTheme) {

        settingsTheme.addEventListener(
            "change",
            function () {

                if (
                    settingsTheme.checked
                ) {

                    document.body.classList.add(
                        "dark"
                    );


                    localStorage.setItem(
                        "felixTheme",
                        "dark"
                    );

                } else {

                    document.body.classList.remove(
                        "dark"
                    );


                    localStorage.setItem(
                        "felixTheme",
                        "light"
                    );

                }

            }
        );

    }

}


function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const isDark =
        document.body.classList.contains(
            "dark"
        );


    localStorage.setItem(
        "felixTheme",
        isDark
            ? "dark"
            : "light"
    );


    if (settingsTheme) {

        settingsTheme.checked =
            isDark;

    }

}


/*
   SETTINGS
*/

function setupSettings() {

    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            function () {

                if (settingsOverlay) {

                    settingsOverlay.classList.add(
                        "show"
                    );

                }

            }
        );

    }


    if (settingsCloseButton) {

        settingsCloseButton.addEventListener(
            "click",
            closeSettings
        );

    }


    if (settingsDoneButton) {

        settingsDoneButton.addEventListener(
            "click",
            closeSettings
        );

    }


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

}


function closeSettings() {

    if (settingsOverlay) {

        settingsOverlay.classList.remove(
            "show"
        );

    }

}


/*
   CLOSE MENUS WHEN CLICKING ELSEWHERE
*/

document.addEventListener(
    "click",
    function () {

        closeAllConversationMenus();

    }
);


/*
   WINDOW RESIZE
*/

window.addEventListener(
    "resize",
    function () {

        if (
            window.innerWidth > 1023 &&
            sidebarBackdrop
        ) {

            sidebarBackdrop.classList.remove(
                "show"
            );

        }

    }
);


/*
   KEYBOARD
*/

document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            if (
                settingsOverlay &&
                settingsOverlay.classList.contains(
                    "show"
                )
            ) {

                closeSettings();

                return;

            }


            closeAllConversationMenus();

            closeSidebar();

        }

    }
);