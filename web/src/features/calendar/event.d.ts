interface Price {
  currency: string;
  major_value?: string;
  value: number;
  display: string;
}

export interface Event {
  locale: string;
  slugified_name: string;
  rank: number;
  currency: string;
  date_header: string;
  logo: {
    url: string;
    edge_color: string;
  };
  organizer: {
    website: string;
    organization_id: string;
    _type: string;
    user_id: string;
    url: string;
    twitter: string;
    logo_id: string;
    disable_marketing_opt_in: boolean;
    id: string;
    name: string;
  };
  id: string;
  ticket_availability: {
    minimum_ticket_price_rounded: Price;
    maximum_ticket_price: Price;
    num_ticket_classes: 1;
    maximum_ticket_price_rounded: Price;
    is_free: boolean;
    minimum_ticket_price: Price;
    has_bogo_tickets: boolean;
    common_sales_end_date: null;
  };
  category: {
    subcategories?: [];
    short_name_localized: string;
    name: string;
    short_name: string;
    name_localized: string;
    id: string;
  };
  venue_id: string;
  user_id: string;
  source: string;
  show_seatmap_thumbnail: boolean;
  inventory_type: string;
  show_colors_in_seatmap_thumbnail: boolean;
  logo_id: string;
  start: {
    utc: string;
    date_header: string;
    timezone: string;
    local: string;
    formatted_time: string;
  };
  listed: boolean;
  is_series: boolean;
  hide_end_date: boolean;
  status: string;
  _type: string;
  description: {
    text: string;
    html: string;
  };
  format: {
    short_name_localized: string;
    name: string;
    short_name: string;
    name_localized: string;
    schema_url: string;
    id: string;
  };
  show_pick_a_seat: boolean;
  is_free: boolean;
  organization_id: string;
  is_externally_ticketed: boolean;
  is_protected_event: boolean;
  is_series_parent: boolean;
  end: {
    timezone: string;
    local: string;
    utc: string;
  };
  format_id: string;
  tld: string;
  series_id: string;
  price_range: string;
  name: {
    text: string;
  };
  language: string;
  url: string;
  venue: {
    user_id: string;
    name: string;
    places: [];
    longitude: string;
    address: {
      city: string;
      country: string;
      region: string;
      longitude: string;
      localized_address_display: string;
      postal_code: string;
      address_1: string;
      address_2: string;
      latitude: string;
      localized_multi_line_address_display: string[];
      localized_area_display: string;
    };
    latitude: string;
    organizer_id: string;
    google_place_id: string;
    id: string;
  };
  current_status: number;
  summary: string;
  published: string;
  is_locked: boolean;
  shareable: boolean;
  style_id: string;
  online_event: boolean;
  organizer_id: string;
  category_id: string;
  survey_type: string;
  subcategory_id: string;
}
