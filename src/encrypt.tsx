import React, { useState } from "react";
import {
  Textarea,
  Button,
  Box,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import {
  TextAnalyticsClient,
  AzureKeyCredential,
} from "@azure/ai-text-analytics";
import CryptoJS from "crypto-js";

const Encrypt: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [piiEntities, setPiiEntities] = useState<
    { original: string; encrypted: string }[]
  >([]);
  const toast = useToast();

  const handleAnalyzeText = async () => {
    // Initialize Azure Text Analytics client
    const textAnalyticsClient = new TextAnalyticsClient(
      "https://text-analytics-demo1.cognitiveservices.azure.com/",
      new AzureKeyCredential("f0c9555dd72f452192efd53cdf422996")
    );

    try {
      // Analyze text for PII entities
      const response = await textAnalyticsClient.recognizePiiEntities(
        [inputText],
        "en"
      );
      const result = response[0]; // Assuming one document is sent
      if ("error" in result && result.error !== undefined) {
        throw new Error(result.error.message);
      }
      let encryptedText = inputText;
      const entities = result.entities
        .filter(
          (entity) =>
            entity.category === "Person" ||
            entity.category === "SGNationalRegistrationIdentityCardNumber" ||
            entity.category === "Email" ||
            entity.category === "PhoneNumber" ||
            entity.category === "Address"
        )
        .map((entity) => {
          // Encrypt only Person and Email PII entities
          const encryptedValue = CryptoJS.AES.encrypt(
            entity.text,
            "secret key 123"
          ).toString();
          // Replace these PII entities with encrypted values
          encryptedText = encryptedText.replace(
            new RegExp(entity.text, "g"),
            encryptedValue
          );
          return {
            original: entity.category,
            encrypted: entity.text,
          };
        });

      setPiiEntities(entities);
      setInputText(encryptedText);

      toast({
        title: "Selected PII Detected and Encrypted",
        description:
          "Any detected Person and Email entities have been encrypted.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to analyze text: ${
          error instanceof Error ? error.message : String(error)
        }`,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Textarea
        placeholder="Enter text here..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <Button mt={4} onClick={handleAnalyzeText}>
        Analyze and Encrypt PII
      </Button>
      {piiEntities.length > 0 && (
        <Table mt={4}>
          <Thead>
            <Tr>
              <Th>Original Value</Th>
              <Th>Encrypted Value</Th>
            </Tr>
          </Thead>
          <Tbody>
            {piiEntities.map((entity, index) => (
              <Tr key={index}>
                <Td>{entity.original}</Td>
                <Td>{entity.encrypted}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default Encrypt;
