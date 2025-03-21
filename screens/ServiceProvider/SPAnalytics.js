import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, PieChart } from "react-native-chart-kit";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import { useTheme } from "../../theme/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import {
  TrendingUp,
  DollarSign,
  Package,
  CreditCard,
  ThumbsUp,
  ThumbsDown,
  Minus,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const SPAnalytics = () => {
  const auth = getAuth();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState("weekly"); // 'daily', 'weekly', 'monthly', 'yearly'
  const [revenueData, setRevenueData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [reviewData, setReviewData] = useState([
    {
      name: "Positive",
      population: 0,
      color: theme.colors.success,
      legendFontColor: "#555555",
      legendFontSize: 12,
    },
    {
      name: "Neutral",
      population: 0,
      color: theme.colors.warning,
      legendFontColor: "#555555",
      legendFontSize: 12,
    },
    {
      name: "Negative",
      population: 0,
      color: theme.colors.error,
      legendFontColor: "#555555",
      legendFontSize: 12,
    },
  ]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [averageRevenue, setAverageRevenue] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [hasReviews, setHasReviews] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
    fetchReviewData();
  }, [timeFrame]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      if (!auth.currentUser) return;

      // Get orders for the current service provider
      const ordersQuery = query(
        collection(db, "orders"),
        where("serviceProviderId", "==", auth.currentUser.uid),
        where("status", "==", "Delivered")
      );

      const querySnapshot = await getDocs(ordersQuery);
      const orders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt
          ? new Date(doc.data().createdAt)
          : new Date(),
      }));

      if (orders.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate total revenue
      const total = orders.reduce(
        (sum, order) => sum + (order.totalPrice || 0),
        0
      );
      setTotalRevenue(total);
      setOrderCount(orders.length);
      setAverageRevenue(total / orders.length);

      // Process data according to the selected timeframe
      const { labels, data } = processDataByTimeFrame(orders, timeFrame);

      setRevenueData({
        labels,
        datasets: [{ data }],
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewData = async () => {
    try {
      if (!auth.currentUser) return;

      // Get reviews for the current service provider from ratings collection
      const reviewsQuery = query(
        collection(db, "ratings"),
        where("serviceProviderId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(reviewsQuery);
      const reviews = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (reviews.length === 0) {
        setHasReviews(false);
        return;
      }

      setHasReviews(true);

      // Count reviews by sentiment
      let positive = 0;
      let neutral = 0;
      let negative = 0;

      reviews.forEach((review) => {
        const rating = review.rating || 0;
        if (rating >= 4) {
          positive++;
        } else if (rating >= 3) {
          neutral++;
        } else {
          negative++;
        }
      });

      setReviewData([
        {
          name: "Positive",
          population: positive,
          color: theme.colors.success,
          legendFontColor: "#555555",
          legendFontSize: 12,
        },
        {
          name: "Neutral",
          population: neutral,
          color: theme.colors.warning,
          legendFontColor: "#555555",
          legendFontSize: 12,
        },
        {
          name: "Negative",
          population: negative,
          color: theme.colors.error,
          legendFontColor: "#555555",
          legendFontSize: 12,
        },
      ]);

      console.log(
        `Reviews found: ${reviews.length} (Positive: ${positive}, Neutral: ${neutral}, Negative: ${negative})`
      );
    } catch (error) {
      console.error("Error fetching review data:", error);
      setHasReviews(false);
    }
  };

  const processDataByTimeFrame = (orders, timeFrame) => {
    const now = new Date();
    let labels = [];
    let dataMap = new Map();

    // Sort orders by date
    orders.sort((a, b) => a.createdAt - b.createdAt);

    switch (timeFrame) {
      case "daily":
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const label = date.toLocaleDateString("en-US", { weekday: "short" });
          labels.push(label);
          dataMap.set(label, 0);
        }

        orders.forEach((order) => {
          if (order.createdAt && isWithinDays(order.createdAt, now, 7)) {
            const day = order.createdAt.toLocaleDateString("en-US", {
              weekday: "short",
            });
            dataMap.set(day, (dataMap.get(day) || 0) + (order.totalPrice || 0));
          }
        });
        break;

      case "weekly":
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i * 7);
          const label = `Week ${4 - i}`;
          labels.push(label);
          dataMap.set(label, 0);
        }

        orders.forEach((order) => {
          if (order.createdAt && isWithinDays(order.createdAt, now, 28)) {
            const weekNum = Math.floor(daysBetween(order.createdAt, now) / 7);
            const weekLabel = `Week ${4 - Math.min(weekNum, 3)}`;
            dataMap.set(
              weekLabel,
              (dataMap.get(weekLabel) || 0) + (order.totalPrice || 0)
            );
          }
        });
        break;

      case "monthly":
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now);
          date.setMonth(date.getMonth() - i);
          const label = date.toLocaleDateString("en-US", { month: "short" });
          labels.push(label);
          dataMap.set(label, 0);
        }

        orders.forEach((order) => {
          if (order.createdAt && isWithinMonths(order.createdAt, now, 6)) {
            const month = order.createdAt.toLocaleDateString("en-US", {
              month: "short",
            });
            dataMap.set(
              month,
              (dataMap.get(month) || 0) + (order.totalPrice || 0)
            );
          }
        });
        break;

      case "yearly":
        // Last 3 years
        for (let i = 2; i >= 0; i--) {
          const date = new Date(now);
          date.setFullYear(date.getFullYear() - i);
          const label = date.getFullYear().toString();
          labels.push(label);
          dataMap.set(label, 0);
        }

        orders.forEach((order) => {
          if (order.createdAt && isWithinYears(order.createdAt, now, 3)) {
            const year = order.createdAt.getFullYear().toString();
            dataMap.set(
              year,
              (dataMap.get(year) || 0) + (order.totalPrice || 0)
            );
          }
        });
        break;

      default:
        break;
    }

    return {
      labels,
      data: labels.map((label) => dataMap.get(label) || 0),
    };
  };

  // Helper functions
  const isWithinDays = (date, targetDate, days) => {
    return daysBetween(date, targetDate) <= days;
  };

  const isWithinMonths = (date, targetDate, months) => {
    const yearDiff = targetDate.getFullYear() - date.getFullYear();
    const monthDiff = targetDate.getMonth() - date.getMonth();
    return yearDiff * 12 + monthDiff <= months;
  };

  const isWithinYears = (date, targetDate, years) => {
    return targetDate.getFullYear() - date.getFullYear() <= years;
  };

  const daysBetween = (date1, date2) => {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
  };

  const chartConfig = {
    backgroundGradientFrom: "#FFFFFF",
    backgroundGradientTo: "#FFFFFF",
    color: (opacity = 1) =>
      `rgba(${hexToRgb(theme.colors.primary)}, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    useShadowColorFromDataset: false,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "5",
      strokeWidth: "2",
      stroke: theme.colors.primary,
    },
    propsForLabels: {
      fontSize: 10,
    },
  };

  // Helper to convert hex to rgb
  const hexToRgb = (hex) => {
    // Remove the # if present
    hex = hex.replace("#", "");

    // Convert the hex values to decimal
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
  };

  const renderChart = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading analytics data...</Text>
        </View>
      );
    }

    if (revenueData.datasets[0].data.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            No completed orders found to display analytics.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={revenueData}
          width={width - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderReviewChart = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading review data...</Text>
        </View>
      );
    }

    if (!hasReviews || reviewData.every((item) => item.population === 0)) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            No reviews found to display analytics.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.chartContainer}>
        <PieChart
          data={reviewData}
          width={width - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
        <View style={styles.reviewLegend}>
          <View style={styles.legendItem}>
            <ThumbsUp size={18} color={theme.colors.success} />
            <Text style={styles.legendText}>Positive</Text>
          </View>
          <View style={styles.legendItem}>
            <Minus size={18} color={theme.colors.warning} />
            <Text style={styles.legendText}>Neutral</Text>
          </View>
          <View style={styles.legendItem}>
            <ThumbsDown size={18} color={theme.colors.error} />
            <Text style={styles.legendText}>Negative</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Revenue Analytics</Text>
          <Text style={styles.headerSubtitle}>
            Track your business performance
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Time Frame Selector - Updated Modern Version */}
        <View style={styles.timeFrameContainer}>
          {["daily", "weekly", "monthly", "yearly"].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.timeFrameButton,
                timeFrame === period && styles.activeTimeFrameButton,
              ]}
              onPress={() => setTimeFrame(period)}
            >
              <Text
                style={[
                  styles.timeFrameText,
                  timeFrame === period && {
                    color: theme.colors.primary,
                    fontWeight: "600",
                  },
                ]}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </Text>
              {timeFrame === period && (
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.primary + "15" },
              ]}
            >
              <DollarSign size={22} color={theme.colors.primary} />
            </View>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statValue}>${totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.success + "15" },
              ]}
            >
              <Package size={22} color={theme.colors.success} />
            </View>
            <Text style={styles.statLabel}>Completed Orders</Text>
            <Text style={styles.statValue}>{orderCount}</Text>
          </View>
          <View style={styles.statCard}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: theme.colors.info + "15" },
              ]}
            >
              <CreditCard size={22} color={theme.colors.info} />
            </View>
            <Text style={styles.statLabel}>Avg. Order Value</Text>
            <Text style={styles.statValue}>${averageRevenue.toFixed(2)}</Text>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <TrendingUp size={20} color={theme.colors.text} />
            <Text style={styles.sectionTitle}>Revenue Trends</Text>
          </View>
          {renderChart()}
        </View>

        {/* Review Chart */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ThumbsUp size={20} color={theme.colors.text} />
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
          </View>
          {renderReviewChart()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerContent: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  timeFrameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  timeFrameButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  activeTimeFrameButton: {
    backgroundColor: "transparent",
  },
  timeFrameText: {
    fontSize: 13,
    color: "#888888",
    fontWeight: "500",
  },
  activeTimeFrameText: {
    color: "#D81B60",
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "50%",
    backgroundColor: "#D81B60",
    borderRadius: 1.5,
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginLeft: 8,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  loadingContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
  },
  noDataContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    textAlign: "center",
    color: "#666666",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
    textAlign: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },
  reviewLegend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 10,
  },
  legendText: {
    fontSize: 12,
    color: "#555555",
    marginLeft: 4,
  },
});

export default SPAnalytics;
