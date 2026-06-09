import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function normalizeMarkdown(text) {
  return text
    .replace(/^\|\|/gm, '|')
    .replace(/\n\|\|/g, '\n|');
}

export default function ChatMarkdown({ content, variant = 'bot' }) {
  const isUser = variant === 'user';

  return (
    <div className={`chat-markdown ${isUser ? 'chat-markdown--user' : 'chat-markdown--bot'}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h3 className="chat-md-heading">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="chat-md-heading">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="chat-md-subheading">{children}</h4>
          ),
          p: ({ children }) => <p className="chat-md-p">{children}</p>,
          ul: ({ children }) => <ul className="chat-md-ul">{children}</ul>,
          ol: ({ children }) => <ol className="chat-md-ol">{children}</ol>,
          li: ({ children }) => <li className="chat-md-li">{children}</li>,
          strong: ({ children }) => <strong className="chat-md-strong">{children}</strong>,
          em: ({ children }) => <em className="chat-md-em">{children}</em>,
          table: ({ children }) => (
            <div className="chat-md-table-wrap">
              <table className="chat-md-table">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="chat-md-thead">{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr className="chat-md-tr">{children}</tr>,
          th: ({ children }) => <th className="chat-md-th">{children}</th>,
          td: ({ children }) => <td className="chat-md-td">{children}</td>,
          code: ({ inline, children }) =>
            inline ? (
              <code className="chat-md-code-inline">{children}</code>
            ) : (
              <code className="chat-md-code-block">{children}</code>
            ),
          hr: () => <hr className="chat-md-hr" />,
        }}
      >
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
