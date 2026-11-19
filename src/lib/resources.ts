export type ResourceKey =
  | "donations"
  | "campaigns"
  | "beneficiaries"
  | "applications"
  | "banks"
  | "ratings";

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "money"
  | "textarea"
  | "select"
  | "checkbox"
  | "date";

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  options?: { label: string; value: string }[];
  optionsKey?: "banks" | "campaigns" | "beneficiaries";
  required?: boolean;
  placeholder?: string;
  help?: string;
};

export type ResourceConfig = {
  key: ResourceKey;
  title: string;
  singular: string;
  description: string;
  icon: string;
  fields: FieldDef[];
  columns: { key: string; label: string }[];
  searchKeys: string[];
};

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Draft", value: "draft" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Failed", value: "failed" },
];

export const RESOURCE_CONFIGS: Record<ResourceKey, ResourceConfig> = {
  donations: {
    key: "donations",
    title: "Donations",
    singular: "Donation",
    description: "Every gift routed through a registered partner bank.",
    icon: "hand",
    fields: [
      { key: "donorName", label: "Donor name", type: "text", required: true },
      { key: "email", label: "Email", type: "email" },
      { key: "amountCents", label: "Amount", type: "money", required: true },
      {
        key: "bankId",
        label: "Partner bank",
        type: "select",
        optionsKey: "banks",
        help: "Settlement route for this gift",
      },
      { key: "campaignId", label: "Season campaign", type: "select", optionsKey: "campaigns" },
      { key: "beneficiaryId", label: "Beneficiary", type: "select", optionsKey: "beneficiaries" },
      { key: "status", label: "Status", type: "select", options: statusOptions },
      { key: "rating", label: "Donor rating (1-5)", type: "number" },
      { key: "message", label: "Message", type: "textarea" },
      { key: "isAnonymous", label: "Anonymous gift", type: "checkbox" },
    ],
    columns: [
      { key: "donorName", label: "Donor" },
      { key: "amountCents", label: "Amount" },
      { key: "bankName", label: "Bank" },
      { key: "campaignTitle", label: "Campaign" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Date" },
    ],
    searchKeys: ["donorName", "email", "message"],
  },
  campaigns: {
    key: "campaigns",
    title: "Campaigns",
    singular: "Campaign",
    description: "Seasonal appeals, goals and impact targets.",
    icon: "sparkles",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "slug", label: "URL slug", type: "text", required: true, placeholder: "season-of-hope" },
      { key: "season", label: "Season", type: "text", required: true },
      { key: "summary", label: "Short summary", type: "textarea" },
      { key: "story", label: "Full story", type: "textarea" },
      { key: "goalCents", label: "Goal", type: "money", required: true },
      { key: "raisedCents", label: "Raised", type: "money" },
      { key: "startDate", label: "Start date", type: "date", required: true },
      { key: "endDate", label: "End date", type: "date", required: true },
      { key: "status", label: "Status", type: "select", options: statusOptions },
      {
        key: "accent",
        label: "Theme",
        type: "select",
        options: [
          { label: "Mint", value: "mint" },
          { label: "Amber", value: "amber" },
          { label: "Violet", value: "violet" },
          { label: "Sky", value: "sky" },
        ],
      },
      { key: "featured", label: "Feature on homepage", type: "checkbox" },
    ],
    columns: [
      { key: "title", label: "Campaign" },
      { key: "season", label: "Season" },
      { key: "raisedCents", label: "Raised" },
      { key: "goalCents", label: "Goal" },
      { key: "status", label: "Status" },
      { key: "endDate", label: "Ends" },
    ],
    searchKeys: ["title", "season", "summary"],
  },
  beneficiaries: {
    key: "beneficiaries",
    title: "Beneficiaries",
    singular: "Beneficiary",
    description: "The people at the centre of every gift.",
    icon: "users",
    fields: [
      { key: "name", label: "Full name", type: "text", required: true },
      {
        key: "category",
        label: "Category",
        type: "select",
        options: [
          { label: "Orphaned child", value: "orphan" },
          { label: "Widow", value: "widow" },
          { label: "Hospitalised", value: "hospitalised" },
        ],
        required: true,
      },
      { key: "age", label: "Age", type: "number" },
      { key: "location", label: "Location", type: "text" },
      { key: "story", label: "Story", type: "textarea" },
      { key: "imageUrl", label: "Photo URL", type: "text" },
      { key: "goalCents", label: "Goal", type: "money" },
      { key: "raisedCents", label: "Raised", type: "money" },
      { key: "campaignId", label: "Campaign", type: "select", optionsKey: "campaigns" },
      { key: "status", label: "Status", type: "select", options: statusOptions },
    ],
    columns: [
      { key: "name", label: "Person" },
      { key: "category", label: "Category" },
      { key: "location", label: "Location" },
      { key: "raisedCents", label: "Raised" },
      { key: "status", label: "Status" },
    ],
    searchKeys: ["name", "location", "story"],
  },
  applications: {
    key: "applications",
    title: "Memberships",
    singular: "Application",
    description: "Top donors applying to join the inner circle.",
    icon: "crown",
    fields: [
      { key: "fullName", label: "Full name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      {
        key: "tier",
        label: "Membership tier",
        type: "select",
        options: [
          { label: "Guardian", value: "Guardian" },
          { label: "Champion", value: "Champion" },
          { label: "Ambassador", value: "Ambassador" },
        ],
      },
      { key: "country", label: "Country", type: "text" },
      { key: "pledgeCents", label: "Monthly pledge", type: "money" },
      { key: "motivation", label: "Why they want to join", type: "textarea" },
      { key: "status", label: "Status", type: "select", options: statusOptions },
      { key: "reviewNote", label: "Review note", type: "textarea" },
    ],
    columns: [
      { key: "fullName", label: "Applicant" },
      { key: "tier", label: "Tier" },
      { key: "pledgeCents", label: "Pledge" },
      { key: "status", label: "Status" },
      { key: "createdAt", label: "Applied" },
    ],
    searchKeys: ["fullName", "email", "motivation"],
  },
  banks: {
    key: "banks",
    title: "Partner banks",
    singular: "Bank",
    description: "Registered micro-banks receiving donated funds.",
    icon: "landmark",
    fields: [
      { key: "name", label: "Bank name", type: "text", required: true },
      { key: "code", label: "Bank code", type: "text", required: true, placeholder: "RH-UG-001" },
      { key: "country", label: "Country", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "feeNote", label: "Fee note", type: "text" },
      { key: "active", label: "Accepting donations", type: "checkbox" },
    ],
    columns: [
      { key: "name", label: "Bank" },
      { key: "code", label: "Code" },
      { key: "country", label: "Country" },
      { key: "total", label: "Received" },
      { key: "active", label: "Status" },
    ],
    searchKeys: ["name", "code", "country"],
  },
  ratings: {
    key: "ratings",
    title: "Season ratings",
    singular: "Rating",
    description: "Donor feedback for this season's campaigns.",
    icon: "star",
    fields: [
      { key: "donorName", label: "Donor name", type: "text", required: true },
      { key: "campaignId", label: "Campaign", type: "select", optionsKey: "campaigns" },
      { key: "rating", label: "Rating (1-5)", type: "number", required: true },
      { key: "comment", label: "Comment", type: "textarea" },
    ],
    columns: [
      { key: "donorName", label: "Donor" },
      { key: "campaignTitle", label: "Campaign" },
      { key: "rating", label: "Rating" },
      { key: "comment", label: "Comment" },
      { key: "createdAt", label: "Date" },
    ],
    searchKeys: ["donorName", "comment"],
  },
};

export const RESOURCE_LIST = Object.keys(RESOURCE_CONFIGS) as ResourceKey[];

export type DynamicField = FieldDef & { optionsKey?: "banks" | "campaigns" | "beneficiaries" };
