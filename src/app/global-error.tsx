"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ marginBottom: "0.5rem", fontSize: "1.5rem", fontWeight: "bold" }}>
              문제가 발생했어요
            </h2>
            <p style={{ marginBottom: "1.5rem", color: "#6b7280" }}>
              일시적인 오류일 수 있어요. 다시 시도해보세요.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                backgroundColor: "#111827",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
