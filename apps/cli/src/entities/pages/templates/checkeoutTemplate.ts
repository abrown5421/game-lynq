export const checkoutTemplate = (pageName: string) => `import { AnimatePresence, motion } from "framer-motion";
import { useAppDispatch, useAppSelector } from "../../app/store/hooks";
import { useEffect, useRef, useState } from "react";
import { Address } from "../../types/user.types";
import { openAlert } from "../../features/alert/alertSlice";
import { useGetPendingOrderQuery, useUpdateOrderMutation } from "../../app/store/api/ordersApi";
import Loader from "../../features/loader/Loader";
import { useNavigate } from "react-router-dom";
import OrderSummary from "../../features/orderSummary/OrderSummary";
import { useUpdateUserMutation } from "../../app/store/api/usersApi";
import CustomerInfoForm from "../../features/forms/CustomerInfoForm";
import AddressBlock from "../../features/forms/AddressBlock";
import FormInput from "../../features/forms/FormInput";

interface CheckoutFormState {
  firstName: string;
  lastName: string;
  email: string;
  mailingAddress: Address;
  billingAddress: Address;
  sameAddress: boolean;
  agreementAccepted: boolean;
  payment: {
    cardNumber: string;
    expiry: string;
    cvv: string;
  };
}

type CheckoutErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  mailingAddress?: Partial<Record<keyof Address, string>>;
  billingAddress?: Partial<Record<keyof Address, string>>;
  agreementAccepted?: string;
  payment?: {
    cardNumber?: string;
    expiry?: string;
    cvv?: string;
  };
};

const ${pageName} = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const expiryRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAppSelector((state) => state.auth);
  const [ updateOrder, { isLoading: isOrderLoading, error: isOrderError }] = useUpdateOrderMutation();
  const [ updateUser, { isLoading: isUserLoading, error: isUserError } ] = useUpdateUserMutation();
  const {
    data: orderData,
    isLoading,
    error,
  } = useGetPendingOrderQuery(user?._id!);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [form, setForm] = useState<CheckoutFormState>({
    firstName: "",
    lastName: "",
    email: "",
    mailingAddress: emptyAddress,
    billingAddress: emptyAddress,
    sameAddress: true,
    agreementAccepted: false,
    payment: { cardNumber: "", expiry: "", cvv: "" },
  });

  const emptyAddress: Address = {
    addrLine1: "",
    addrLine2: "",
    addrCity: "",
    addrState: "",
    addrZip: 0,
  };
  
  const formatExpiry = (
    raw: string,
    prev: string,
    input: HTMLInputElement
  ) => {
    let digits = raw.replace(/\\D/g, "").slice(0, 6);

    if (
      prev.length === 3 &&
      digits.length === 2 &&
      input.selectionStart === 2
    ) {
      digits = digits.slice(0, 2);
    }

    let formatted = digits;

    if (digits.length >= 3) {
      formatted = \`\${digits.slice(0, 2)}/\${digits.slice(2)}\`;
    }

    requestAnimationFrame(() => {
      if (!expiryRef.current) return;
      expiryRef.current.setSelectionRange(
        formatted.length,
        formatted.length
      );
    });

    return formatted;
  };

  const isNumeric = (value: string) => /^\\d+$/.test(value);

  const isExpiryFormatValid = (value: string) =>
    /^(0[1-9]|1[0-2])\\/\\d{4}$/.test(value);

  const isExpiryInFuture = (value: string) => {
    if (!isExpiryFormatValid(value)) return false;

    const [month, year] = value.split("/").map(Number);

    const expiryDate = new Date(year, month, 0, 23, 59, 59);
    const now = new Date();

    return expiryDate > now;
  };

  const validateAddress = (address: Address) => {
    const addrErrors: any = {};
    if (!address.addrLine1) addrErrors.addrLine1 = "Address line 1 is required";
    if (!address.addrCity) addrErrors.addrCity = "City is required";
    if (!address.addrState) addrErrors.addrState = "State is required";
    if (!address.addrZip) {
      addrErrors.addrZip = "Zip code is required";
    } else if (!isNumeric(String(address.addrZip))) {
      addrErrors.addrZip = "Zip code must be numeric";
    }
    return addrErrors;
  };

  const validate = () => {
    let valid = true;
    const newErrors: CheckoutErrors = {};

    if (!form.firstName) {
      newErrors.firstName = "First name is required";
      valid = false;
    }
    if (!form.lastName) {
      newErrors.lastName = "Last name is required";
      valid = false;
    }
    if (!form.email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!form.email.includes("@") || !form.email.includes(".")) {
      newErrors.email = "Email must be valid";
      valid = false;
    }

    const mailingErrors = validateAddress(form.mailingAddress);
    if (Object.keys(mailingErrors).length) {
      newErrors.mailingAddress = mailingErrors;
      valid = false;
    }

    if (!form.sameAddress) {
      const billingErrors = validateAddress(form.billingAddress);
      if (Object.keys(billingErrors).length) {
        newErrors.billingAddress = billingErrors;
        valid = false;
      }
    }

    if (!form.agreementAccepted) {
      newErrors.agreementAccepted =
        "You must accept this acknowledgment to complete your order";
      valid = false;
    }

    const paymentValidations = [
      {
        field: "cardNumber",
        message: "Card number is required",
        validator: () => !form.payment.cardNumber,
      },
      {
        field: "cardNumber",
        message: "Card number must be numeric",
        validator: () =>
          form.payment.cardNumber &&
          !isNumeric(form.payment.cardNumber),
      },
      {
        field: "cardNumber",
        message: "Card number must be between 13 and 19 digits",
        validator: () => {
          const len = form.payment.cardNumber.length;
          return len < 13 || len > 19;
        },
      },
      {
        field: "expiry",
        message: "Expiry date is required",
        validator: () => !form.payment.expiry,
      },
      {
        field: "expiry",
        message: "Format must be MM/YYYY",
        validator: () =>
          form.payment.expiry &&
          !isExpiryFormatValid(form.payment.expiry),
      },
      {
        field: "expiry",
        message: "Card is expired",
        validator: () =>
          form.payment.expiry &&
          isExpiryFormatValid(form.payment.expiry) &&
          !isExpiryInFuture(form.payment.expiry),
      },
      {
        field: "cvv",
        message: "CVV is required",
        validator: () => !form.payment.cvv,
      },
      {
        field: "cvv",
        message: "CVV must be numeric",
        validator: () =>
          form.payment.cvv && !isNumeric(form.payment.cvv),
      },
      {
        field: "cvv",
        message: "CVV must be at least 3 digits",
        validator: () => form.payment.cvv.length < 3,
      },
    ];
    paymentValidations.forEach(({ field, message, validator }) => {
      if (validator()) {
        newErrors.payment = { ...newErrors.payment, [field]: message };
        valid = false;
      }
    });

    setErrors(newErrors);

    if (!valid) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "error",
          message: "There were errors in your form",
          anchor: { x: "right", y: "bottom" },
        })
      );
    }

    return valid;
  };

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
      mailingAddress: user.mailingAddress ?? emptyAddress,
      billingAddress: user.billingAddress ?? emptyAddress,
      sameAddress: user.sameAddress ?? true,
    }));
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : value;

    setForm((prev) => {
      if (name.includes(".")) {
        const [parent, child] = name.split(".");

        if (parent === "payment") {
          if (child === "expiry") {
            return {
              ...prev,
              payment: {
                ...prev.payment,
                expiry: formatExpiry(
                  value,
                  prev.payment.expiry,
                  e.target
                ),
              },
            };
          }

          return {
            ...prev,
            payment: { ...prev.payment, [child]: finalValue },
          };
        }

        if (parent === "mailingAddress" || parent === "billingAddress") {
          return {
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: child === "addrZip" ? Number(finalValue) : finalValue,
            },
          };
        }
      }

      if (name === "sameAddress") {
        return {
          ...prev,
          sameAddress: finalValue as boolean,
          billingAddress: finalValue
            ? prev.mailingAddress
            : prev.billingAddress,
        };
      }

      return { ...prev, [name]: finalValue };
    });

    setErrors((prev) => ({ ...prev }));
  };

  const handleSubmit = async(e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!validate() || !orderData || !user) return;
    try {
      await updateUser({
        id: user?._id,
        data: { mailingAddress: form.mailingAddress, billingAddress: form.billingAddress } 
      }).unwrap(); 
    } catch (err) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "error",
          message: "There was a problem submitting your request. Please try again later.",
          anchor: { x: "right", y: "bottom" },
        })
      );
    }

    try {
      await updateOrder({
        id: orderData._id,
        userId: user._id,
        data: {
          order_status: "purchased",
          order_paid: true,
        },
      }).unwrap();
      navigate(\`/order-complete/\${orderData?._id}\`)
    } catch (err) {
      dispatch(
        openAlert({
          open: true,
          closeable: true,
          severity: "error",
          message: "There was a problem submitting your request. Please try again later.",
          anchor: { x: "right", y: "bottom" },
        })
      );
    }
    
  };

  useEffect(() => {
    if (form.sameAddress) {
      setForm((prev) => ({ ...prev, billingAddress: prev.mailingAddress }));
    }
  }, [form.mailingAddress, form.sameAddress]);

    return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-neutral sup-min-nav relative z-0 p-4"
    >
      {isLoading ? (
        <div className="bg-neutral sup-min-nav relative z-0 p-4 flex justify-center items-center">
            <Loader />
        </div>
      ) : error ? (
        <div className="text-center text-red-500 mt-10 font-primary">
          <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-neutral-500">
            Sorry, there was a problem please try again later.
          </p>
        </div>
      ) : !orderData ? (
        <div className="text-center mt-10 font-primary">
          <h2 className="text-2xl font-semibold mb-2 text-neutral-contrast">Your Cart is Empty</h2>
          <p className="text-neutral-500">
            Add some items to your cart to proceed with checkout.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-contrast font-primary">Checkout</h1>
            <p className="text-neutral-contrast mt-1">
              {orderData.order_item_count} {orderData.order_item_count === 1 ? 'item' : 'items'}
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              
              <CustomerInfoForm
                firstName={form.firstName}
                lastName={form.lastName}
                email={form.email}
                errors={errors}
                onChange={handleChange}
              />

              <AddressBlock
                mailingAddress={form.mailingAddress}
                billingAddress={form.billingAddress}
                sameAddress={form.sameAddress}
                errors={errors}
                onChange={handleChange}
              />

              <div className="bg-neutral3 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-neutral font-primary">
                  Payment Information
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <FormInput
                    name="payment.cardNumber"
                    value={form.payment.cardNumber}
                    onChange={handleChange}
                    placeholder="Card Number"
                    error={errors.payment?.cardNumber}
                    className="md:col-span-2"
                  />
                  <FormInput
                    name="payment.expiry"
                    value={form.payment.expiry}
                    onChange={handleChange}
                    placeholder="MM/YYYY"
                    error={errors.payment?.expiry}
                    inputRef={expiryRef}
                  />
                  <FormInput
                    name="payment.cvv"
                    value={form.payment.cvv}
                    onChange={handleChange}
                    placeholder="CVV"
                    error={errors.payment?.cvv}
                  />
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="bg-neutral3 rounded-lg p-6 space-y-4">
                  <h2 className="text-xl font-semibold text-neutral font-primary">
                    Confirm Order
                  </h2>
                  

                  <label className="flex items-start gap-2 text-sm text-neutral-contrast">
                    <input
                      type="checkbox"
                      name="agreementAccepted"
                      checked={form.agreementAccepted}
                      onChange={handleChange}
                      className="mt-1"
                    />
                    <div className="flex flex-col">
                      <span>I understand and agree to the below statement</span>
                      {errors.agreementAccepted && (
                        <span className="text-red-500 text-xs">
                          {errors.agreementAccepted}
                        </span>
                      )}
                    </div>
                  </label>

                  <p className="text-xs text-gray-500">
                    By checking this box, you confirm that, to the best of your knowledge,
                    the information provided above is accurate. You also acknowledge that
                    this application is for educational purposes only, that no charges will
                    be made to the payment method entered, and that you will not receive the
                    item you are "purchasing."
                  </p>

                </div>
              </div>
            </div>
            <OrderSummary 
              orderData={orderData} 
              mode="checkout"
              onPrimaryAction={handleSubmit}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ${pageName}`