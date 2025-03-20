import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineChart, PieChart } from "react-native-chart-kit";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../../firebaseConfig";
import Header from "../../components/Header";
import { useTheme } from "../../theme/ThemeContext";

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
      color: "#4CAF50",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Neutral",
      population: 0,
      color: "#FFC107",
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    },
    {
      name: "Negative",
      population: 0,
      color: "#F44336",
      legendFontColor: "#7F7F7F",
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
          color: "#4CAF50",
          legendFontColor: "#7F7F7F",
          legendFontSize: 12,
        },
        {
          name: "Neutral",
          population: neutral,
          color: "#FFC107",
          legendFontColor: "#7F7F7F",
          legendFontSize: 12,
        },
        {
          name: "Negative",
          population: negative,
          color: "#F44336",
          legendFontColor: "#7F7F7F",
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
    backgroundGradientFrom: theme.colors.background,
    backgroundGradientTo: theme.colors.background,
    color: (opacity = 1) => `rgba(81, 150, 244, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 10,
    },
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
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Revenue Analytics" showBack />
      <ScrollView style={styles.scrollView}>
        {/* Time Frame Selector */}
        <View style={styles.timeFrameContainer}>
          <TouchableOpacity
            style={[
              styles.timeFrameButton,
              timeFrame === "daily" && styles.activeTimeFrameButton,
            ]}
            onPress={() => setTimeFrame("daily")}
          >
            <Text
              style={[
                styles.timeFrameText,
                timeFrame === "daily" && styles.activeTimeFrameText,
              ]}
            >
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeFrameButton,
              timeFrame === "weekly" && styles.activeTimeFrameButton,
            ]}
            onPress={() => setTimeFrame("weekly")}
          >
            <Text
              style={[
                styles.timeFrameText,
                timeFrame === "weekly" && styles.activeTimeFrameText,
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeFrameButton,
              timeFrame === "monthly" && styles.activeTimeFrameButton,
            ]}
            onPress={() => setTimeFrame("monthly")}
          >
            <Text
              style={[
                styles.timeFrameText,
                timeFrame === "monthly" && styles.activeTimeFrameText,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.timeFrameButton,
              timeFrame === "yearly" && styles.activeTimeFrameButton,
            ]}
            onPress={() => setTimeFrame("yearly")}
          >
            <Text
              style={[
                styles.timeFrameText,
                timeFrame === "yearly" && styles.activeTimeFrameText,
              ]}
            >
              Yearly
            </Text>
          </TouchableOpacity>
        </View>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Trends</Text>
          {renderChart()}
        </View>

        {/* Review Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          {renderReviewChart()}
        </View>

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statValue}>${totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Completed Orders</Text>
            <Text style={styles.statValue}>{orderCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. Order Value</Text>
            <Text style={styles.statValue}>${averageRevenue.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
  },
  timeFrameContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  timeFrameButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#EAEAEA",
  },
  activeTimeFrameButton: {
    backgroundColor: "#5196F4",
  },
  timeFrameText: {
    fontSize: 14,
    color: "#666666",
  },
  activeTimeFrameText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
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
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },
});

export default SPAnalytics;
