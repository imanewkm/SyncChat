import React from "react";
import Chat from "./Chat/Chat";

function App() {
  // example contactId
  const contactId = "123";

  return (
    <div className="App">
      <h1>Welcome to SyncChat</h1>
      <Chat contactId={contactId} />
    </div>
  );
}

export default App;
