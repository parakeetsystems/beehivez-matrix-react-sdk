import { defaultBindingsProvider } from './KeyBindingsDefaults';
import { isMac } from './Keyboard';

/** Actions for the chat message composer component */
export enum MessageComposerAction {
    /** Send a message */
    Send = 'Send',
    /** Go backwards through the send history and use the message in composer view */
    SelectPrevSendHistory = 'SelectPrevSendHistory',
    /** Go forwards through the send history */
    SelectNextSendHistory = 'SelectNextSendHistory',
    /** Start editing the user's last sent message */
    EditPrevMessage = 'EditPrevMessage',
    /** Start editing the user's next sent message */
    EditNextMessage = 'EditNextMessage',
    /** Cancel editing a message or cancel replying to a message*/
    CancelEditing = 'CancelEditing',

    /** Set bold format the current selection */
    FormatBold = 'FormatBold',
    /** Set italics format the current selection */
    FormatItalics = 'FormatItalics',
    /** Format the current selection as quote */
    FormatQuote = 'FormatQuote',
    /** Undo the last editing */
    EditUndo = 'EditUndo',
    /** Redo editing */
    EditRedo = 'EditRedo',
    /** Insert new line */
    NewLine = 'NewLine',
    MoveCursorToStart = 'MoveCursorToStart',
    MoveCursorToEnd = 'MoveCursorToEnd',
}

/** Actions for text editing autocompletion */
export enum AutocompleteAction {
    /** Apply the current autocomplete selection */
    ApplySelection = 'ApplySelection',
    /** Cancel autocompletion */
    Cancel = 'Cancel',
    /** Move to the previous autocomplete selection */
    PrevSelection = 'PrevSelection',
    /** Move to the next autocomplete selection */
    NextSelection = 'NextSelection',
}

/** Actions for the left room list sidebar */
export enum RoomListAction {
    /** Clear room list filter field */
    ClearSearch = 'ClearSearch',
    /** Navigate up/down in the room list */
    PrevRoom = 'PrevRoom',
    /** Navigate down in the room list */
    NextRoom = 'NextRoom',
    /** Select room from the room list */
    SelectRoom = 'SelectRoom',
    /** Collapse room list section */
    CollapseSection = 'CollapseSection',
    /** Expand room list section, if already expanded, jump to first room in the selection */
    ExpandSection = 'ExpandSection',
}

/** Actions for the current room view */
export enum RoomAction {
    /** Jump to room search (search for a room)*/
    FocusRoomSearch = 'FocusRoomSearch', // TODO: move to NavigationAction?
    /** Scroll up in the timeline */
    ScrollUp = 'ScrollUp',
    /** Scroll down in the timeline */
    RoomScrollDown = 'RoomScrollDown',
    /** Dismiss read marker and jump to bottom */
    DismissReadMarker = 'DismissReadMarker',
    /** Jump to oldest unread message */
    JumpToOldestUnread = 'JumpToOldestUnread',
    /* Upload a file */
    UploadFile = 'UploadFile',
    /* Focus search message in a room (must be enabled) */
    FocusSearch = 'FocusSearch',
    /* Jump to the first (downloaded) message in the room */
    JumpToFirstMessage = 'JumpToFirstMessage',
    /* Jump to the latest message in the room */
    JumpToLatestMessage = 'JumpToLatestMessage',
}

/** Actions for navigating do various menus / dialogs / screens */
export enum NavigationAction {
    /** Toggle the room side panel */
    ToggleRoomSidePanel = 'ToggleRoomSidePanel',
    /** Toggle the user menu */
    ToggleUserMenu = 'ToggleUserMenu',
    /* Toggle the short cut help dialog */
    ToggleShortCutDialog = 'ToggleShortCutDialog',
    /* Got to the Element home screen */
    GoToHome = 'GoToHome',
    /* Select prev room */
    SelectPrevRoom = 'SelectPrevRoom',
    /* Select next room */
    SelectNextRoom = 'SelectNextRoom',
    /* Select prev room with unread messages*/
    SelectPrevUnreadRoom = 'SelectPrevUnreadRoom',
    /* Select next room with unread messages*/
    SelectNextUnreadRoom = 'SelectNextUnreadRoom',
}

/**
 * Represent a key combination.
 *
 * The combo is evaluated strictly, i.e. the KeyboardEvent must match exactly what is specified in the KeyCombo.
 */
export type KeyCombo = {
    key?: string;

    /** On PC: ctrl is pressed; on Mac: meta is pressed */
    ctrlOrCmd?: boolean;

    altKey?: boolean;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
}

export type KeyBinding<T extends string> = {
    action: T;
    keyCombo: KeyCombo;
}

/**
 * Helper method to check if a KeyboardEvent matches a KeyCombo
 *
 * Note, this method is only exported for testing.
 */
export function isKeyComboMatch(ev: KeyboardEvent | React.KeyboardEvent, combo: KeyCombo, onMac: boolean): boolean {
    if (combo.key !== undefined) {
        // When shift is pressed, letters are returned as upper case chars. In this case do a lower case comparison.
        // This works for letter combos such as shift + U as well for none letter combos such as shift + Escape.
        // If shift is not pressed, the toLowerCase conversion can be avoided.
        if (ev.shiftKey) {
            if (ev.key.toLowerCase() !== combo.key.toLowerCase()) {
                return false;
            }
        } else if (ev.key !== combo.key) {
            return false;
        }
    }

    const comboCtrl = combo.ctrlKey ?? false;
    const comboAlt = combo.altKey ?? false;
    const comboShift = combo.shiftKey ?? false;
    const comboMeta = combo.metaKey ?? false;
    // When ctrlOrCmd is set, the keys need do evaluated differently on PC and Mac
    if (combo.ctrlOrCmd) {
        if (onMac) {
            if (!ev.metaKey
                || ev.ctrlKey !== comboCtrl
                || ev.altKey !== comboAlt
                || ev.shiftKey !== comboShift) {
                return false;
            }
        } else {
            if (!ev.ctrlKey
                || ev.metaKey !== comboMeta
                || ev.altKey !== comboAlt
                || ev.shiftKey !== comboShift) {
                return false;
            }
        }
        return true;
    }

    if (ev.metaKey !== comboMeta
        || ev.ctrlKey !== comboCtrl
        || ev.altKey !== comboAlt
        || ev.shiftKey !== comboShift) {
        return false;
    }

    return true;
}

export type KeyBindingGetter<T extends string> = () => KeyBinding<T>[];

export interface IKeyBindingsProvider {
    getMessageComposerBindings: KeyBindingGetter<MessageComposerAction>;
    getAutocompleteBindings: KeyBindingGetter<AutocompleteAction>;
    getRoomListBindings: KeyBindingGetter<RoomListAction>;
    getRoomBindings: KeyBindingGetter<RoomAction>;
    getNavigationBindings: KeyBindingGetter<NavigationAction>;
}

export class KeyBindingsManager {
    /**
     * List of key bindings providers.
     *
     * Key bindings from the first provider(s) in the list will have precedence over key bindings from later providers.
     *
     * To overwrite the default key bindings add a new providers before the default provider, e.g. a provider for
     * customized key bindings.
     */
    bindingsProviders: IKeyBindingsProvider[] = [
        defaultBindingsProvider,
    ];

    /**
     * Finds a matching KeyAction for a given KeyboardEvent
     */
    private getAction<T extends string>(getters: KeyBindingGetter<T>[], ev: KeyboardEvent | React.KeyboardEvent)
        : T | undefined {
        for (const getter of getters) {
            const bindings = getter();
            const binding = bindings.find(it => isKeyComboMatch(ev, it.keyCombo, isMac));
            if (binding) {
                return binding.action;
            }
        }
        return undefined;
    }

    getMessageComposerAction(ev: KeyboardEvent | React.KeyboardEvent): MessageComposerAction | undefined {
        return this.getAction(this.bindingsProviders.map(it => it.getMessageComposerBindings), ev);
    }

    getAutocompleteAction(ev: KeyboardEvent | React.KeyboardEvent): AutocompleteAction | undefined {
        return this.getAction(this.bindingsProviders.map(it => it.getAutocompleteBindings), ev);
    }

    getRoomListAction(ev: KeyboardEvent | React.KeyboardEvent): RoomListAction | undefined {
        return this.getAction(this.bindingsProviders.map(it => it.getRoomListBindings), ev);
    }

    getRoomAction(ev: KeyboardEvent | React.KeyboardEvent): RoomAction | undefined {
        return this.getAction(this.bindingsProviders.map(it => it.getRoomBindings), ev);
    }

    getNavigationAction(ev: KeyboardEvent | React.KeyboardEvent): NavigationAction | undefined {
        return this.getAction(this.bindingsProviders.map(it => it.getNavigationBindings), ev);
    }
}

const manager = new KeyBindingsManager();

export function getKeyBindingsManager(): KeyBindingsManager {
    return manager;
}
