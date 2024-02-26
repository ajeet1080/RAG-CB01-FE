import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Link,
  LinearProgress,
  Button,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { useToast } from "@chakra-ui/react";
import PersonIcon from "@mui/icons-material/Person";
import AndroidIcon from "@mui/icons-material/Android";
import chatlogo from "./assets/chatbot_animation.gif";

import jumping_dots from "./assets/jumping_dots.gif";
import companyLogo from "./assets/singhealth-logo.png";
import divider from "./assets/shs-divider.png";
import skhlogo from "./assets/skh-logo.png";

interface ChatMessage {
  sender: "user" | "bot";
  content: string;
  context?: string[];
  pageNum?: string[];
  fileName?: string[];
  contextVisible?: boolean;
  currentDataIndex?: number;
}

type ParsedData = {
  page_label_1: string;
  page_label_2: string;
  file_name_1: string;
  file_name_2: string;
  content_text_1: string;
  content_text_2: string;
};

const App: React.FC = () => {
  const [input, setInput] = useState("");
  const toast = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffer, setBuffer] = useState(10);
  const bottomOfChat = useRef<HTMLDivElement>(null);
  const [showGif, setShowGif] = useState(true);
  const [response, setResponse] = useState<any>(null);
  const [metadata, setMetadata] = useState<string>("");
  const [data, setData] = useState<ParsedData | null>(null);
  const [lastBotMessageIndex, setLastBotMessageIndex] = useState(-1);

  const scrollToBottom = () => {
    bottomOfChat.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            return 0;
          }
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 100);
        });
        setBuffer((oldBuffer) => {
          if (oldBuffer < 100) {
            const diff = Math.random() * 10;
            return Math.min(oldBuffer + diff, 100);
          }
          return 10;
        });
      }, 500);

      return () => {
        clearInterval(timer);
      };
    }
  }, [isLoading]);
  //Test
  useEffect(() => {
    const text = metadata;

    const pageLabel1Match = text.match(/page_label_1: (.*?),/);
    const pageLabel1 = pageLabel1Match ? pageLabel1Match[1] : "";

    const pageLabel2Match = text.match(/page_label_2: (.*?),/);
    const pageLabel2 = pageLabel2Match ? pageLabel2Match[1] : "";

    const fileName1Match = text.match(/file_name_1: (.*?),/);
    const fileName1 = fileName1Match ? fileName1Match[1] : "";

    const fileName2Match = text.match(/file_name_2: (.*?),/);
    const fileName2 = fileName2Match ? fileName2Match[1] : "";

    const contentText1Match = text.match(
      /content_text_1: (.*?),content_text_2:/s
    );
    const contentText1 = contentText1Match ? contentText1Match[1] : "";

    const contentText2Match = text.match(/content_text_2: (.*$)/s);
    const contentText2 = contentText2Match ? contentText2Match[1] : "";

    const parsedData = {
      page_label_1: pageLabel1,
      page_label_2: pageLabel2,
      file_name_1: fileName1,
      file_name_2: fileName2,
      content_text_1: contentText1,
      content_text_2: contentText2,
    };

    setData(parsedData);
  }, [metadata]);

  const parseMetadata = (text: string): ParsedData => {
    const pageLabel1Match = text.match(/page_label_1: (.*?),/);
    const pageLabel1 = pageLabel1Match ? pageLabel1Match[1] : "";

    const pageLabel2Match = text.match(/page_label_2: (.*?),/);
    const pageLabel2 = pageLabel2Match ? pageLabel2Match[1] : "";

    const fileName1Match = text.match(/file_name_1: (.*?),/);
    const fileName1 = fileName1Match ? fileName1Match[1] : "";

    const fileName2Match = text.match(/file_name_2: (.*?),/);
    const fileName2 = fileName2Match ? fileName2Match[1] : "";

    const contentText1Match = text.match(
      /content_text_1: (.*?),content_text_2:/s
    );
    const contentText1 = contentText1Match ? contentText1Match[1] : "";

    const contentText2Match = text.match(/content_text_2: (.*$)/s);
    const contentText2 = contentText2Match ? contentText2Match[1] : "";

    const parsedData = {
      page_label_1: pageLabel1,
      page_label_2: pageLabel2,
      file_name_1: fileName1,
      file_name_2: fileName2,
      content_text_1: contentText1,
      content_text_2: contentText2,
    };

    return parsedData;
  };

  const sendMessage = async () => {
    if (input.trim() === "") return;
    setShowGif(false);
    const userMessage: ChatMessage = { sender: "user", content: input };
    let botMessage: ChatMessage = {
      sender: "bot",
      content: "",
      context: [],
      pageNum: [],
      fileName: [],
      contextVisible: false,
      currentDataIndex: 0,
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setMessages((prevMessages) => [...prevMessages, botMessage]);
    setIsLoading(true);
    setInput("");

    try {
      const searchResponse = await fetch(
        "https://ragapi.azurewebsites.net/llama_search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: input }),
        }
      );

      if (!searchResponse.ok) {
        throw new Error("Search API responded with an error.");
      } else {
        const reader = searchResponse.body?.getReader();
        let chunk;
        let metaDataText = "";

        const botMessage: ChatMessage = {
          sender: "bot",
          content: "",
          context: [],
          pageNum: [],
          fileName: [],
          contextVisible: false,
          currentDataIndex: 0,
        };

        while (true) {
          chunk = await reader?.read();
          if (chunk && chunk.done) {
            break;
          }
          const chunkText = new TextDecoder("utf-8").decode(chunk?.value);
          const lines = chunkText.split("\n");
          if (lines.length === 1) {
            botMessage.content += lines[0];
          } else {
            metaDataText += lines;
            setMetadata(metaDataText); // Set metadata first

            let parsedData = parseMetadata(metaDataText); // Function to parse metadata

            botMessage.context = [
              parsedData?.content_text_1 ?? "",
              parsedData?.content_text_2 ?? "",
            ];
            botMessage.pageNum = [
              parsedData?.page_label_1 ?? "",
              parsedData?.page_label_2 ?? "",
            ];
            botMessage.fileName = [
              parsedData?.file_name_1 ?? "",
              parsedData?.file_name_2 ?? "",
            ];
          }

          await new Promise((resolve) => setTimeout(resolve, 60));
          setResponse(botMessage.content);

          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            updatedMessages[updatedMessages.length - 1].content =
              botMessage.content;
            updatedMessages[updatedMessages.length - 1].context =
              botMessage.context;
            updatedMessages[updatedMessages.length - 1].pageNum =
              botMessage.pageNum;
            updatedMessages[updatedMessages.length - 1].fileName =
              botMessage.fileName;
            return updatedMessages;
          });
          setIsLoading(false);
          setInput("");
        }
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Error",
        description: "An error occurred while fetching the response.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleContextVisibility = (index: number) => {
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      updatedMessages[index].contextVisible =
        !updatedMessages[index].contextVisible;
      return updatedMessages;
    });
  };

  const nextData = (index: number) => {
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      if (updatedMessages[index].currentDataIndex! < 1) {
        updatedMessages[index].currentDataIndex! += 1;
      }
      return updatedMessages;
    });
  };

  const prevData = (index: number) => {
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      if (updatedMessages[index].currentDataIndex! > 0) {
        updatedMessages[index].currentDataIndex! -= 1;
      }
      return updatedMessages;
    });
  };

  const renderMessages = () =>
    messages.map((message, index) => (
      <Box
        key={index}
        sx={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "5px",
          width: "80%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            flexDirection: message.sender === "user" ? "row-reverse" : "row",
          }}
        >
          <Avatar
            sx={{
              bgcolor: message.sender === "user" ? "primary.main" : "#E54809",
              marginRight: message.sender === "user" ? "10px" : "0",
              marginLeft: message.sender === "user" ? "0" : "10px",
            }}
          >
            {message.sender === "user" ? <PersonIcon /> : <AndroidIcon />}
          </Avatar>
          <Box
            sx={{
              padding: "10px",
              background: message.sender === "user" ? "white" : "white",
              borderRadius: "10px",
              maxWidth: "80%",
            }}
          >
            <Typography
              variant="body1"
              style={{
                fontWeight: message.sender === "user" ? "bold" : "normal",
                fontSize: message.sender === "user" ? "1.1rem" : "1rem",
              }}
            >
              {message.content}
            </Typography>
          </Box>
          {message.sender === "bot" &&
            isLoading &&
            index === messages.length - 1 && (
              <img
                height={50}
                src={jumping_dots}
                alt="Loading"
                style={{ marginLeft: "10px" }}
              />
            )}
        </Box>

        {message.sender === "bot" && !isLoading && (
          <Box sx={{ alignSelf: "flex-start", marginLeft: "48px" }}>
            <Link
              component="button"
              variant="body2"
              onClick={() => toggleContextVisibility(index)}
              sx={{
                cursor: "pointer",
                textDecoration: "none",
                color: "secondary.main",
              }}
            >
              reference
            </Link>
            {message.contextVisible && (
              <Typography
                variant="body2"
                style={{ marginTop: "8px", backgroundColor: "#fdfbf2" }}
              >
                <strong>
                  {message.fileName![message.currentDataIndex!]} | Page{" "}
                  {message.pageNum![message.currentDataIndex!]}
                </strong>
                <br />
                {message.context![message.currentDataIndex!]}
                <br />
                <Button
                  onClick={() => prevData(index)}
                  disabled={message.currentDataIndex === 0}
                >
                  Back
                </Button>
                <Button
                  onClick={() => nextData(index)}
                  disabled={message.currentDataIndex === 1}
                >
                  Next
                </Button>
              </Typography>
            )}
          </Box>
        )}
      </Box>
    ));

  return (
    <Container
      maxWidth="lg"
      style={{
        marginTop: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        justifyContent: "space-between",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px",
        }}
      >
        <img
          src={companyLogo}
          alt="Company Logo"
          style={{ width: "150px", height: "85px" }}
        />
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Chatbot
        </Typography>
        <img
          src={skhlogo}
          alt="SKH Logo"
          style={{ width: "90px", height: "91px" }}
        />
      </Box>
      <img src={divider} alt="divider" height={10} />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          overflowY: "auto",
          marginBottom: "24px",
          justifyContent: showGif ? "center" : "flex-start",
          alignItems: "center",
        }}
      >
        {showGif ? (
          <img
            src={chatlogo}
            alt="Chatbot Animation"
            style={{ alignSelf: "center" }}
          />
        ) : (
          renderMessages()
        )}
        <div ref={bottomOfChat} />
      </Box>

      <Box
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <TextField
          style={{ width: "80%" }}
          variant="outlined"
          placeholder="Type your message here..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && input.trim() !== "") {
              sendMessage();
            }
          }}
        />
        <IconButton color="primary" onClick={sendMessage}>
          <SendIcon />
        </IconButton>
      </Box>
    </Container>
  );
};

export default App;
