import { sanitize } from "dompurify";
import { channels, channelColors } from "../App";
import { useMessages, MessageType } from "../state/messages";
import { useUsers } from "../state/users";
import { useState } from "react";
import { useUser } from "@compose-run/client";
import Modal from "./Modal";
import Messages from "./Messages";
import ReplyInput from "./ReplyInput";

const marked = require("marked");
var dayjs = require("dayjs");
var relativeTime = require("dayjs/plugin/relativeTime");
dayjs.extend(relativeTime);

export default function Message({
  channel,
  message: { body, id, sender, createdAt, replyTo, tags },
  style: { borderBottom },
}: {
  channel: string;
  message: MessageType;
  style: { borderBottom: string };
}) {
  const [users] = useUsers();
  const user = useUser();
  const [editing, setEditing] = useState(false);
  const [editingMsg, setEditingMsg] = useState("");
  const [, messageDispatch] = useMessages();
  const [deleteModalShown, setDeleteModalShown] = useState(false);
  // FIXME: deleting, setDeleting use very error prone (has to be set on delete
  // modal close, cancel button, etc.)
  const [deleting, setDeleting] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  // The tags that are not just the channel name.
  const tagsHere = tags.filter((tag) => tag !== channel);
  const buttonStyleTODO =
    "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";
  const dangerButtonStyleTODO =
    "bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded";
  function bodyHTML() {
    return { __html: sanitize(marked.parse(body)) };
  }
  const saveMsg = () => {
    setEditing(false);
    // TODO: resolve edit message promise, show a spinner or greyed out version
    // of the message while we know the result.
    messageDispatch({
      type: "MessageEdit",
      messageId: id,
      body: editingMsg,
    });
    setEditingMsg("");
  };
  return (
    <>
      <Modal show={deleteModalShown} onClose={() => setDeleteModalShown(false)}>
        <div
          className={
            "grid grid-cols-1 gap-4" + (deleting ? "animate-pulse" : "")
          }
        >
          <div>Are you sure you want to delete this message?</div>
          <div className="flex gap-2">
            <>
              {
                // TODO: Get a consistent button style for the whole app.
              }
              <button
                disabled={deleting}
                className={dangerButtonStyleTODO}
                onClick={() => {
                  // TODO: resolve delete promise
                  messageDispatch({ type: "MessageDelete", messageId: id });
                  setDeleting(true);
                }}
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setDeleteModalShown(false);
                  setDeleting(false);
                }}
                className={buttonStyleTODO}
              >
                Cancel
              </button>
            </>
          </div>
        </div>
      </Modal>

      <div
        style={{
          paddingBottom: 10,
          paddingTop: 10,
          borderBottom,
        }}
      >
        <div className="group">
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              rowGap: "10px",
              columnGap: "5px",
              flexWrap: "wrap",
            }}
          >
            <b>{(users && users[sender].name) || "User " + sender}</b>
            <div style={{ display: "flex", columnGap: "5px" }}>
              <div style={{ fontSize: "0.7em" }}>
                {dayjs(createdAt).fromNow()}
              </div>
              {tagsHere.length !== 0 ? (
                <div>
                  {tagsHere.map((tag, index) => (
                    <div
                      key={index}
                      style={{
                        fontSize: "0.7em",
                        padding: 2,
                        fontFamily: "monospace",
                        backgroundColor: channelColors[channels.indexOf(tag)],
                        borderRadius: 5,
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              ) : (
                <></>
              )}
              <div
                className="hidden group-hover:flex gap-1"
                style={{
                  fontSize: "0.7em",
                }}
              >
                {user ? (
                  <button onClick={() => setShowReplyInput(!showReplyInput)}>
                    💬
                  </button>
                ) : (
                  <></>
                )}
                {user && user.id === sender ? (
                  <>
                    {editing ? (
                      <></>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingMsg(body);
                          setEditing(true);
                        }}
                      >
                        ✏️
                      </button>
                    )}
                    <button onClick={() => setDeleteModalShown(true)}>
                      ❌
                    </button>
                  </>
                ) : (
                  <></>
                )}
              </div>
            </div>
          </div>
          {editing ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                columnGap: "20px",
                alignItems: "right",
                flexDirection: "column",
                padding: "10px",
              }}
            >
              <textarea
                value={editingMsg}
                onChange={(e) => {
                  setEditingMsg((e.target as HTMLTextAreaElement).value);
                }}
                onKeyPress={(e) => {
                  // TODO - disable for mobile
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    saveMsg();
                  }
                }}
              ></textarea>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  columnGap: "20px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => {
                    setEditing(false);
                    setEditingMsg("");
                  }}
                >
                  Cancel
                </button>
                <button onClick={saveMsg}>Save</button>
              </div>
            </div>
          ) : (
            <div
              style={{ marginTop: 8 }}
              dangerouslySetInnerHTML={bodyHTML()}
            ></div>
          )}
          <div style={{ fontSize: "0.7em", marginTop: 8, display: "flex" }}>
            <div style={{ color: "#1c6ba7" }} /* TODO onClick */>
              {0 /* TODO - count replies */} replies
            </div>
            <div style={{ marginLeft: 4, color: "#9a999a" }}>
              Last reply{" "}
              {dayjs(createdAt).fromNow() /* TODO - last reply time */}
            </div>
          </div>
        </div>
        {
          // TODO: Wonky to keep channel around for a "reply"?
        }
        {showReplyInput ? (
          <ReplyInput replyTo={id} onReply={() => setShowReplyInput(false)} />
        ) : (
          <></>
        )}
        <div style={{ paddingLeft: "10px" }}>
          <Messages channel={channel} replyTo={id} />
        </div>
      </div>
    </>
  );
}
