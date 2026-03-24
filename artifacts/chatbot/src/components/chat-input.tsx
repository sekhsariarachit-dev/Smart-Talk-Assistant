import React, { useState, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Mic, Paperclip, Send, X, File as FileIcon, Image as ImageIcon, Video } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech";
import { useUploadFile } from "@workspace/api-client-react";
import { useTutorial } from "@/lib/tutorial-context";
import { cn } from "@/lib/utils";

interface Attachment {
  url: string;
  name: string;
  type: string;
  extractedContent?: string;
}

interface ChatInputProps {
  onSend: (content: string, attachments: Attachment[], generateMode?: string) => void;
  disabled?: boolean;
}

const GENERATE_MODES = [
  { id: "blog", label: "📝 Blog Post" },
  { id: "script", label: "🎬 Script" },
  { id: "notes", label: "📋 Notes" },
  { id: "presentation", label: "📊 Slides" },
  { id: "reel", label: "🎥 Reel" },
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<Attachment[]>([]);
  attachmentsRef.current = attachments;

  const uploadFile = useUploadFile();
  const { currentStep, advance } = useTutorial();

  const handleSpeechResult = (text: string) => {
    if (!text.trim()) return;
    onSend(text.trim(), attachmentsRef.current);
    setAttachments([]);
    if (currentStep === "type_message") advance("type_message");
    if (currentStep === "voice_input") advance("voice_input");
  };

  const { isListening, toggleListening, isSupported } = useSpeechRecognition(handleSpeechResult);

  const handleSend = (generateMode?: string) => {
    if ((!content.trim() && attachments.length === 0) || disabled || isUploading) return;
    const msgContent = content.trim() || (attachments.length > 0 ? `Process the attached file.` : "");
    onSend(msgContent, attachments, generateMode);
    setContent("");
    setAttachments([]);
    if (currentStep === "type_message") advance("type_message");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (currentStep === "attach_file") advance("attach_file");

    setIsUploading(true);
    try {
      const file = files[0];
      const result = await uploadFile.mutateAsync({ data: { file } });
      setAttachments(prev => [...prev, {
        url: result.url,
        name: result.name,
        type: result.type,
        extractedContent: result.extractedContent
      }]);
    } catch (error) {
      console.error("Failed to upload file:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon size={16} className="text-blue-500" />;
    if (type.startsWith("video/")) return <Video size={16} className="text-purple-500" />;
    return <FileIcon size={16} className="text-gray-500" />;
  };

  const hasContent = content.trim().length > 0 || attachments.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      {attachments.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg py-1.5 px-3 text-sm animate-in fade-in slide-in-from-bottom-2">
                {getFileIcon(att.type)}
                <span className="truncate max-w-[150px] font-medium text-gray-700">{att.name}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="text-xs text-gray-400 font-medium mr-1 self-center">Generate:</span>
            {GENERATE_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleSend(mode.id)}
                disabled={disabled || isUploading}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-black hover:text-white border border-gray-200 hover:border-black transition-all disabled:opacity-50"
              >
                {mode.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className={cn(
        "relative flex items-end gap-2 bg-white rounded-2xl border-2 border-gray-100 p-2 transition-all duration-200 shadow-sm",
        "focus-within:border-black focus-within:shadow-md",
        currentStep === "type_message" && "ring-4 ring-black/10 border-black"
      )}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple={false}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className={cn(
            "p-3 rounded-xl text-gray-400 hover:text-black hover:bg-gray-100 transition-colors disabled:opacity-50",
            currentStep === "attach_file" && "bg-black/5 text-black ring-2 ring-black"
          )}
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>

        <TextareaAutosize
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isUploading ? "Uploading file…" : isListening ? "Listening… speak now" : "Message AI…"}
          className="w-full resize-none bg-transparent border-0 focus:ring-0 p-3 text-base text-black placeholder:text-gray-400 max-h-[200px] overflow-y-auto scrollbar-hide focus:outline-none"
          minRows={1}
          maxRows={8}
          disabled={disabled || isUploading || isListening}
        />

        {isSupported && (
          <button
            onClick={toggleListening}
            disabled={disabled || isUploading}
            className={cn(
              "p-3 rounded-xl transition-all duration-300 disabled:opacity-50",
              isListening
                ? "bg-red-50 text-red-500 animate-pulse"
                : "text-gray-400 hover:text-black hover:bg-gray-100",
              currentStep === "voice_input" && !isListening && "bg-black/5 text-black ring-2 ring-black"
            )}
            title={isListening ? "Stop recording" : "Voice input"}
          >
            <Mic size={20} />
          </button>
        )}

        <button
          onClick={() => handleSend()}
          disabled={!hasContent || disabled || isUploading}
          className={cn(
            "p-3 rounded-xl bg-black text-white shadow-lg shadow-black/10 transition-all duration-200",
            "hover:shadow-xl hover:bg-gray-900 active:scale-95",
            "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          )}
          title="Send message"
        >
          <Send size={20} className="ml-0.5" />
        </button>
      </div>
    </div>
  );
}
