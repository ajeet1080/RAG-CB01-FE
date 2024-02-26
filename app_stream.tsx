// src/App.tsx
import React, { useEffect, useState } from "react";
import { Box, Button, Input, VStack } from "@chakra-ui/react";

type ParsedData = {
  page_label_1: string;
  page_label_2: string;
  file_name_1: string;
  file_name_2: string;
  content_text_1: string;
  content_text_2: string;
};

const App: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [response, setResponse] = useState<any>(null);
  const [metadata, setMetadata] = useState<string>("");
  const [data, setData] = useState<ParsedData | null>(null);

  const handleSearch = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/llama_search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const reader = res.body?.getReader();
      let chunk;
      let resultText = document.createElement("div");
      let metaDataText = document.createElement("div");
      resultText.innerText = "";
      metaDataText.innerText = "";
      while (true) {
        chunk = await reader?.read();
        if (chunk && chunk.done) {
          break;
        }
        const chunkText = new TextDecoder("utf-8").decode(chunk?.value);
        const lines = chunkText.split("\n");
        console.log(lines);
        lines.length === 1
          ? (resultText.innerText += lines[0])
          : (metaDataText.innerText += lines);

        //resultText.innerText += lines[0];
        await new Promise((resolve) => setTimeout(resolve, 60));
        setResponse(resultText.innerText);
        setMetadata(metaDataText.innerText);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
  }, []);

  return (
    <Box p={5} maxWidth={1500} overflow="auto">
      <VStack spacing={5}>
        <Input
          placeholder="Enter query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button colorScheme="teal" onClick={handleSearch}>
          Search
        </Button>
        <Box width="500px" maxWidth={500}>
          <h2>Response:</h2>
          <div>{JSON.stringify(response, null, 2)}</div>
          <h2>Response:</h2>
          <div>
            {data && (
              <>
                <p>{data.page_label_1}</p>

                <p>{data.page_label_2}</p>

                <p>{data.file_name_1}</p>

                <p>{data.file_name_2}</p>

                <p>{data.content_text_1}</p>

                <p>{data.content_text_2}</p>
              </>
            )}
          </div>
        </Box>
      </VStack>
    </Box>
  );
};

export default App;
