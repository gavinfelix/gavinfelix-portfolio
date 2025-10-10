export function PromptInputTextarea() {
  return (
    <textarea
      className="m-4 mb-6 mt-2 w-full flex-1 resize-none rounded-md border border-gray-300 bg-white p-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
      placeholder="Send a message..."
      rows={1}
    ></textarea>
  );
}
