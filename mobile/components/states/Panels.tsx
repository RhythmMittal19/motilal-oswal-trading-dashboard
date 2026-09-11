import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";
import type { ApiError } from "@/types/market";

export function LoadingPanel({ label }: { label: string }) {
  return (
    <View style={styles.panel}>
      <ActivityIndicator color={theme.muted} />
      <Text style={styles.description}>{label}</Text>
    </View>
  );
}

export function EmptyPanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

export function ErrorPanel({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void;
}) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Couldn&apos;t load market data</Text>
      <Text style={styles.description}>{error.message}</Text>
      <Text style={styles.code}>{error.code}</Text>

      <Pressable onPress={onRetry} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonLabel}>Try again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { alignItems: "center", paddingVertical: 44, paddingHorizontal: 24, gap: 6 },
  title: { color: theme.ink, fontSize: 14, fontWeight: "600" },
  description: { color: theme.muted, fontSize: 12, textAlign: "center" },
  code: { color: theme.muted, fontSize: 10, opacity: 0.7 },
  button: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.line,
    backgroundColor: theme.elevated,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  buttonLabel: { color: theme.ink, fontSize: 12, fontWeight: "600" },
});
