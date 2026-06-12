export type NavItem = {
  href: string;
  label: string;
};

export const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/catalog", label: "Catalog" },
  { href: "/shelf", label: "Shelf" },
  { href: "/feed", label: "Feed" },
];

export const secondaryNavItems: NavItem[] = [
  { href: "/people", label: "People" },
  { href: "/recommendations", label: "Discover" },
  { href: "/requests", label: "Requests" },
];

export function navItemsForUser(options: { isAdmin: boolean }) {
  const mobile = options.isAdmin
    ? [
        ...primaryNavItems,
        ...secondaryNavItems,
        { href: "/admin/books", label: "Admin" },
      ]
    : [...primaryNavItems, ...secondaryNavItems];

  const more = options.isAdmin
    ? [...secondaryNavItems, { href: "/admin/books", label: "Admin" }]
    : secondaryNavItems;

  return {
    primary: primaryNavItems,
    more,
    mobile,
  };
}
