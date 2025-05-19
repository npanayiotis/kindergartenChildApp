// src/screens/childStatus/ChildStatusDetailScreen.tsx
import React, {useState, useEffect} from 'react';
import {View, StyleSheet, ScrollView, Alert} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Text,
  Divider,
  Chip,
  ActivityIndicator,
} from 'react-native-paper';
import {RouteProp, useRoute} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {getChildStatusDetails, ChildStatusDetail} from '../../api/childStatus';
import {theme} from '../../theme';

type RouteParams = {
  ChildStatusDetail: {
    statusId: string;
    childName: string;
  };
};

export default function ChildStatusDetailScreen() {
  const [status, setStatus] = useState<ChildStatusDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const {token} = useAuth();
  const route = useRoute<RouteProp<RouteParams, 'ChildStatusDetail'>>();
  const {statusId} = route.params;

  useEffect(() => {
    const fetchStatusDetails = async () => {
      if (!token || !statusId) {
        return;
      }

      try {
        setLoading(true);
        const result = await getChildStatusDetails(token, statusId);

        if (result.error) {
          Alert.alert('Error', result.error);
        } else if (result.data) {
          setStatus(result.data);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch child status details');
      } finally {
        setLoading(false);
      }
    };

    fetchStatusDetails();
  }, [token, statusId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) {
      return 'No date';
    }

    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          animating={true}
          size="large"
          color={theme.colors.primary}
        />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!status) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Status not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.childName}>{status.childName}</Title>
          <Paragraph style={styles.dateText}>
            Last updated: {formatDate(status.updatedAt || status.createdAt)}
          </Paragraph>

          <Divider style={styles.divider} />

          <View style={styles.sectionContainer}>
            <Title style={styles.sectionTitle}>Child Information</Title>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Birth Date:</Text>
              <Text style={styles.detailValue}>
                {status.child.birthDate
                  ? new Date(status.child.birthDate).toLocaleDateString()
                  : 'Not specified'}
              </Text>
            </View>

            {status.child.allergies && status.child.allergies.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Allergies:</Text>
                <View style={styles.chipsContainer}>
                  {status.child.allergies.map((allergy, index) => (
                    <Chip
                      key={index}
                      style={styles.chip}
                      mode="outlined"
                      icon="alert-circle">
                      {allergy}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            {status.child.specialNeeds && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Special Needs:</Text>
                <Text style={styles.detailValue}>
                  {status.child.specialNeeds}
                </Text>
              </View>
            )}
          </View>

          <Divider style={styles.divider} />

          <View style={styles.sectionContainer}>
            <Title style={styles.sectionTitle}>Today's Status</Title>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Mood:</Text>
              <Text style={styles.detailValue}>
                {status.mood || 'Not recorded'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Meal:</Text>
              <Text style={styles.detailValue}>
                {status.meal || 'Not recorded'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nap:</Text>
              <Text style={styles.detailValue}>
                {status.nap || 'Not recorded'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Activity:</Text>
              <Text style={styles.detailValue}>
                {status.activity || 'Not recorded'}
              </Text>
            </View>
          </View>

          {status.notes && (
            <>
              <Divider style={styles.divider} />

              <View style={styles.sectionContainer}>
                <Title style={styles.sectionTitle}>Notes</Title>
                <Paragraph style={styles.notes}>{status.notes}</Paragraph>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.m,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    color: theme.colors.textSecondary,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
  },
  card: {
    marginBottom: theme.spacing.m,
    elevation: 2,
  },
  childName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    marginTop: theme.spacing.xs,
  },
  divider: {
    marginVertical: theme.spacing.m,
  },
  sectionContainer: {
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: theme.spacing.s,
    color: theme.colors.primary,
  },
  detailRow: {
    marginBottom: theme.spacing.m,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.xs,
  },
  detailValue: {
    fontSize: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.xs,
  },
  chip: {
    marginRight: theme.spacing.s,
    marginBottom: theme.spacing.s,
  },
  notes: {
    fontSize: 16,
    lineHeight: 24,
  },
});
