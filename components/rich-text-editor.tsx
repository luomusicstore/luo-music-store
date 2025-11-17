"use client"

import { useEffect, useRef } from "react"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const insertImage = () => {
    const url = prompt("Enter image URL:")
    if (url) {
      execCommand("insertImage", url)
    }
  }

  const insertLink = () => {
    const url = prompt("Enter link URL:")
    if (url) {
      execCommand("createLink", url)
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-100 border-b p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<h1>")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm font-semibold"
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<h2>")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm font-semibold"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "<h3>")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm font-semibold"
          title="Heading 3"
        >
          H3
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm font-bold"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm italic"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm underline"
          title="Underline"
        >
          U
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
          title="Numbered List"
        >
          1. List
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={insertLink}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
          title="Insert Link"
        >
          🔗 Link
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
          title="Insert Image"
        >
          🖼️ Image
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={() => execCommand("justifyLeft")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
          title="Align Left"
        >
          ⬅️
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyCenter")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
          title="Align Center"
        >
          ↔️
        </button>
        <button
          type="button"
          onClick={() => execCommand("justifyRight")}
          className="px-3 py-1 bg-white border rounded hover:bg-gray-50 text-sm"
          title="Align Right"
        >
          ➡️
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[400px] p-4 focus:outline-none prose max-w-none"
        data-placeholder={placeholder}
        style={{
          ...(value === "" && {
            position: "relative",
          }),
        }}
      />

      <style jsx>{`
        [contentEditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
      `}</style>
    </div>
  )
}
