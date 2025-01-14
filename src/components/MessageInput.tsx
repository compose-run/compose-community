import { useEffect, useRef, useState } from "react";
import { Channel, channelColors, channels } from "../App";
import { useUser, User } from "@compose-run/client";
import { MessageActionError, useMessages } from "../state/messages";
import Modal from "./Modal";
import LoginModal from "./LoginModal";
import { undefinedify } from "../utils";

export default function MessageInput({
  channel,
  setChannel,
}: {
  channel: Channel;
  setChannel: (channel: Channel) => void;
}) {
  const user: User | null = useUser();
  const [, dispatchMessageAction] = useMessages();
  const [message, setMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTagModal, setShowTagModal] = useState(false);
  const [messageSending, setMessageSending] = useState(false);

  async function actuallySendMessage() {
    // TODO: Having to check for user again is smelly.
    if (!user) {
      return "Unauthorized";
    }

    setMessageSending(true);
    let result = await dispatchMessageAction({
      type: "MessageCreate",
      sender: user.id, //  TODO -  set this via context, and link to username
      body: message,
      tags: [channel], // TODO - find all tags
    });
    setMessageSending(false);
    setMessage("");
    return result;
  }

  function sendMessage() {
    if (message.length < 1) {
      // TODO - error
    } else if (!user) {
      setShowLoginModal(true);
    } else if (channel === "all") {
      setShowTagModal(true);
    } else {
      actuallySendMessage();
    }
  }

  return (
    <>
      <div className="flex">
        <textarea
          rows={message.split("\n").length}
          value={message}
          style={{
            width: "100%",
            padding: 7,
            border: "1.5px solid lightgray",
            borderRadius: 4,
            margin: 10,
          }}
          placeholder={
            "Send message" + (channel === "all" ? "..." : ` to ${channel}`)
          }
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          onChange={(e) => {
            setMessage((e.target as HTMLTextAreaElement).value);
            const newChannel = channels
              .filter((c) => c !== "all" && c !== channel)
              .find(
                (c) =>
                  e.target.value === c ||
                  e.target.value.startsWith(c + " ") ||
                  e.target.value.endsWith(" " + c) ||
                  e.target.value.includes(" " + c + " ")
              );
            if (newChannel) {
              // TODO - remove all other channels via regex

              setChannel(newChannel);
            }
          }}
          className={undefinedify(messageSending) && "animate-pulse"}
          disabled={messageSending}
        />
        <span className="absolute inset-r-0 right-0 bottom-0 flex items-center pr-5 pb-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-1 focus:outline-none focus:shadow-outline"
          >
            ➡️
          </button>
        </span>
      </div>
      <LoginModal
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        message="Create an account to send your message"
      />
      <AddTagModal
        showTagModal={showTagModal}
        setShowTagModal={setShowTagModal}
        channel={channel}
        setChannel={setChannel}
        actuallySendMessage={actuallySendMessage}
      />
    </>
  );
}

function AddTagModal({
  showTagModal,
  setShowTagModal,
  channel,
  setChannel,
  actuallySendMessage,
}: {
  showTagModal: boolean;
  setShowTagModal: (showTagModal: boolean) => void;
  channel: string;
  setChannel: (channel: Channel) => void;
  actuallySendMessage: () => Promise<MessageActionError>;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTagModal) return;
    modalRef.current?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        actuallySendMessage();
        setShowTagModal(false);
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [channel, showTagModal, actuallySendMessage, setShowTagModal]);

  return (
    <Modal show={showTagModal} onClose={() => setShowTagModal(false)}>
      <div
        ref={modalRef}
        tabIndex={0}
        style={{
          marginTop: 35,
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <div
          style={{
            marginBottom: 38,
            fontSize: "1.35em",
            fontWeight: 300,
          }}
        >
          Add a tag to your message
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-evenly",
          }}
        >
          {channels.slice(1).map((c, channelIndex) => (
            <button
              key={c}
              onClick={() => {
                setChannel(c);
                actuallySendMessage();
                setShowTagModal(false);
              }}
              onMouseEnter={() => {
                setChannel(c);
              }}
              style={{
                backgroundColor: channelColors[channelIndex + 1],
                borderRadius: "3px",
                padding: "5px",
                boxShadow:
                  c === channel ? "rgb(33 33 33 / 36%) 0px 0px 11px 0px" : "",
                transition: "box-shadow .3s",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
