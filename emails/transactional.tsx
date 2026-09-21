import { Html, Head, Preview, Body, Container, Heading, Text, Hr } from "@react-email/components";
export function TransactionalEmail({ subject, text }: { subject: string; text: string }) {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={{ background: "#f6f7f8", fontFamily: "Arial, sans-serif", color: "#14181d" }}>
        <Container
          style={{ background: "#fff", padding: 32, margin: "32px auto", borderRadius: 16 }}
        >
          <Heading style={{ color: "#2f6e51" }}>EchoFoil</Heading>
          <Heading as="h2" style={{ fontSize: 22 }}>
            {subject}
          </Heading>
          <Hr />
          {text.split("\n").map((line, i) => (
            <Text key={i} style={{ fontSize: 15, lineHeight: 1.6, overflowWrap: "anywhere" }}>
              {line}
            </Text>
          ))}
        </Container>
      </Body>
    </Html>
  );
}
