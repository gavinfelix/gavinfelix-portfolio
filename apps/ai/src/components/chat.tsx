"use client";
import { Messages } from "./messages";
import { MultimodalInput } from "./mutimodal-input";

export function Chat({}) {
  return (
    <>
      <div>
        <Messages />
        --
        <MultimodalInput />
      </div>
    </>
  );
}
