/**
 * DocumentEditor.tsx
 * Controlled textarea - dengan logging untuk debug
 */
import { useRef, useEffect } from "react";
import { useCollaborativeDocument } from "../hooks/useCollaborativeDocument";

interface DocumentEditorProps {
    documentId: string;
}

export function DocumentEditor({ documentId }: DocumentEditorProps) {
    const { text, insertChar, deleteChar } = useCollaborativeDocument(documentId);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lastCursorPosRef = useRef<number>(0);

    // ⭐ LOG: setiap render
    console.log(`[editor] 🔄 render text = "${text}"`);

    // ===== HANDLE LOCAL EDIT =====
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newText = e.target.value;
        const oldText = text;

        if (newText === oldText) return;

        console.log(`[editor] 🔵 local change: "${oldText}" → "${newText}"`);

        lastCursorPosRef.current = e.target.selectionStart || 0;

        // ---- DIFF DETECTION ----
        if (newText.length > oldText.length) {
            // INSERT
            let diffIndex = 0;
            const minLen = Math.min(oldText.length, newText.length);
            while (diffIndex < minLen && oldText[diffIndex] === newText[diffIndex]) {
                diffIndex++;
            }
            const insertedChar = newText[diffIndex] || "";
            if (insertedChar) {
                console.log(`[editor] ✅ insert at ${diffIndex}: "${insertedChar}"`);
                insertChar(diffIndex, insertedChar);
            }
        } else if (newText.length < oldText.length) {
            // DELETE
            let diffIndex = 0;
            const minLen = Math.min(oldText.length, newText.length);
            while (diffIndex < minLen && oldText[diffIndex] === newText[diffIndex]) {
                diffIndex++;
            }
            console.log(`[editor] ✅ delete at ${diffIndex}`);
            deleteChar(diffIndex);
        }
    };

    // ===== SAVE CURSOR POSITION =====
    const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        lastCursorPosRef.current = target.selectionStart || 0;
        console.log(`[editor] 📍 cursor at: ${lastCursorPosRef.current}`);
    };

    // ===== RESTORE CURSOR AFTER REMOTE UPDATE =====
    useEffect(() => {
        if (textareaRef.current) {
            const pos = Math.min(lastCursorPosRef.current, text.length);
            textareaRef.current.setSelectionRange(pos, pos);
            console.log(`[editor] 🔄 restored cursor to: ${pos}`);
        }
    }, [text]);

    return (
        <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onSelect={handleSelect}
            onClick={handleSelect}
            onKeyUp={handleSelect}
            style={{
                width: "100%",
                minHeight: 300,
                padding: 16,
                fontFamily: "monospace",
                fontSize: 16,
                border: "2px solid #4CAF50",
                borderRadius: 8,
                outline: "none",
                backgroundColor: "#fafafa",
                lineHeight: 1.6,
                resize: "vertical",
            }}
        />
    );
}