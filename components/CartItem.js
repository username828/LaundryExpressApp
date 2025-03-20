import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import QuantityControl from "./QuantityControl";

/**
 * CartItem Component
 *
 * @param {Object} props
 * @param {string} props.title - Service name
 * @param {number} props.price - Price per item
 * @param {number} props.quantity - Quantity
 * @param {function} props.onUpdateQuantity - Function to call with new quantity
 * @param {function} props.onRemove - Function to call when removing item (optional)
 * @param {Object} props.style - Additional styles for the container
 */
const CartItem = ({
  title,
  price,
  quantity,
  onUpdateQuantity,
  onRemove,
  style,
  ...props
}) => {
  const theme = useTheme();

  const handleIncrement = () => {
    onUpdateQuantity(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      onUpdateQuantity(quantity - 1);
    } else if (onRemove) {
      onRemove();
    } else {
      onUpdateQuantity(0);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderBottomColor: theme.colors.borderLight,
          borderBottomWidth: 1,
        },
        style,
      ]}
      {...props}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: theme.colors.backgroundLight },
        ]}
      >
        <FontAwesome5 name="tshirt" size={20} color={theme.colors.primary} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {title}
          </Text>
          {onRemove && (
            <TouchableOpacity
              onPress={onRemove}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.price, { color: theme.colors.textSecondary }]}>
          ${price.toFixed(2)} / item
        </Text>

        <View style={styles.bottomRow}>
          <QuantityControl
            value={quantity}
            onIncrease={handleIncrement}
            onDecrease={handleDecrement}
            min={1}
          />

          <Text style={[styles.subtotal, { color: theme.colors.secondary }]}>
            ${(price * quantity).toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  price: {
    fontSize: 14,
    marginBottom: 12,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtotal: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CartItem;
