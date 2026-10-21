import { Component, type ErrorInfo, type ReactNode } from "react";
import { Icon } from "./ui/Icon";
import {
  faTriangleExclamation,
  faRotateRight,
  faBroom,
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Unhandled error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleResetStorage = (): void => {
    if (window.confirm("Reset active character session to default? (This will clear localStorage cache and reload)")) {
      try {
        localStorage.clear();
      } catch {}
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            backgroundColor: "#121316",
            color: "#abb2bf",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "Inter, sans-serif",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              padding: "32px",
              backgroundColor: "#1c1e24",
              borderRadius: "12px",
              border: "1px solid #e06c75",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <Icon icon={faTriangleExclamation} size="2x" style={{ color: "#e06c75" }} />
            </div>
            <h2 style={{ color: "#e06c75", margin: "0 0 12px 0", fontSize: "1.4rem" }}>
              Something went wrong loading the sheet
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#abb2bf", marginBottom: "16px" }}>
              An error occurred during render:
            </p>
            <pre
              style={{
                backgroundColor: "rgba(0,0,0,0.4)",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                color: "#e5c07b",
                overflowX: "auto",
                textAlign: "left",
                maxHeight: "150px",
                marginBottom: "20px",
              }}
            >
              {this.state.error?.message || "Unknown error"}
              {this.state.errorInfo?.componentStack && (
                <div style={{ marginTop: "8px", opacity: 0.8, fontSize: "0.75rem", whiteSpace: "pre-wrap" }}>
                  {this.state.errorInfo.componentStack}
                </div>
              )}
            </pre>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  backgroundColor: "#e06c75",
                  color: "#fff",
                  border: "none",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Icon icon={faRotateRight} /> Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleResetStorage}
                style={{
                  background: "transparent",
                  color: "#abb2bf",
                  border: "1px solid #2f333d",
                  padding: "8px 18px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Icon icon={faBroom} /> Clear Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
