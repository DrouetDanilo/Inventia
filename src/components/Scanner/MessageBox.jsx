// src/components/Scanner/MessageBox.jsx
function MessageBox({ type, text }) {
  return <div className={`msg-box msg-${type}`}>{text}</div>;
}

export default MessageBox;
