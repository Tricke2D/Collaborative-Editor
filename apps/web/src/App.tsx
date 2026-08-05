import { DocumentEditor } from "./components/DocumentEditor";
import "./App.css";

function App() {
    const documentId = "demo-doc-1";

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
            <h1>📝 Collaborative Editor</h1>
            <p style={{ color: "#666", marginBottom: 16 }}>
                Document ID: <code>{documentId}</code>
            </p>
            <p style={{ color: "#999", fontSize: 14, marginBottom: 16 }}>
                💡 Open this page in 2 tabs to test real-time collaboration
            </p>
            <DocumentEditor documentId={documentId} />
            <p style={{ color: "#999", fontSize: 12, marginTop: 16 }}>
                🔍 Check browser console (F12) for debug logs
            </p>
        </div>
    );
}

export default App;