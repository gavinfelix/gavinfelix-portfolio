import { memo, useEffect } from "react";

export function Messages() {
  return (
    <div className="overscroll-behavior-contain -webkit-overflow-scrolling-touch flex-1 touch-pan-y overflow-y-scroll">
      hello! this is Messages component.
    </div>
  );
}
