import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error, info) {
    console.error("[Soon crash]", error, info);
    this.setState({ error });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main
        style={{
          minHeight: "100dvh",
          padding: 20,
          background: "#020617",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1>Erreur Soon</h1>
        <p>Copie-colle ce message :</p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "rgba(255,255,255,0.08)",
            borderRadius: 14,
            padding: 14,
            overflow: "auto",
          }}
        >
          {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
        </pre>
      </main>
    );
  }
}
