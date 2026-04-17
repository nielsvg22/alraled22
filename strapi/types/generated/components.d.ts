import type { Schema, Struct } from '@strapi/strapi';

export interface ElementsSpecialization extends Struct.ComponentSchema {
  collectionName: 'components_elements_specializations';
  info: {
    displayName: 'Specialization';
    icon: 'briefcase';
  };
  attributes: {
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String;
  };
}

export interface ElementsStat extends Struct.ComponentSchema {
  collectionName: 'components_elements_stats';
  info: {
    displayName: 'Stat';
    icon: 'chart-bar';
  };
  attributes: {
    label: Schema.Attribute.String;
    subtext: Schema.Attribute.String;
    suffix: Schema.Attribute.String;
    value: Schema.Attribute.Integer;
  };
}

export interface ElementsStep extends Struct.ComponentSchema {
  collectionName: 'components_elements_steps';
  info: {
    displayName: 'Step';
    icon: 'list-ol';
  };
  attributes: {
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface ElementsTextLine extends Struct.ComponentSchema {
  collectionName: 'components_elements_text_lines';
  info: {
    displayName: 'Text Line';
    icon: 'minus';
  };
  attributes: {
    text: Schema.Attribute.Text;
  };
}

export interface PluginWebbycommerceShippingZoneLocation
  extends Struct.ComponentSchema {
  collectionName: 'components_shared_shipping_zone_locations';
  info: {
    description: 'Reusable location rules for shipping zones (stored as text, parsed by backend).';
    displayName: 'Shipping Zone Location';
  };
  attributes: {
    countries: Schema.Attribute.Text;
    postal_codes: Schema.Attribute.Text;
    states: Schema.Attribute.Text;
  };
}

export interface SectionsCta extends Struct.ComponentSchema {
  collectionName: 'components_sections_ctas';
  info: {
    displayName: 'CTA';
    icon: 'bullhorn';
  };
  attributes: {
    primaryButton: Schema.Attribute.String;
    secondaryButton: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SectionsHero extends Struct.ComponentSchema {
  collectionName: 'components_sections_heroes';
  info: {
    displayName: 'Hero';
    icon: 'layer-group';
  };
  attributes: {
    backgroundImage: Schema.Attribute.Media<'images'>;
    primaryButtonText: Schema.Attribute.String;
    secondaryButtonText: Schema.Attribute.String;
    subtitle: Schema.Attribute.Text;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SectionsIntroduction extends Struct.ComponentSchema {
  collectionName: 'components_sections_introductions';
  info: {
    displayName: 'Introduction';
    icon: 'align-left';
  };
  attributes: {
    badge: Schema.Attribute.String;
    boldText: Schema.Attribute.String;
    content: Schema.Attribute.Component<'elements.text-line', true>;
    marqueeText: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SectionsProcess extends Struct.ComponentSchema {
  collectionName: 'components_sections_processes';
  info: {
    displayName: 'Process';
    icon: 'sync';
  };
  attributes: {
    buttonText: Schema.Attribute.String;
    description: Schema.Attribute.Text;
    image: Schema.Attribute.Media<'images'>;
    steps: Schema.Attribute.Component<'elements.step', true>;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'elements.specialization': ElementsSpecialization;
      'elements.stat': ElementsStat;
      'elements.step': ElementsStep;
      'elements.text-line': ElementsTextLine;
      'plugin::webbycommerce.shipping-zone-location': PluginWebbycommerceShippingZoneLocation;
      'sections.cta': SectionsCta;
      'sections.hero': SectionsHero;
      'sections.introduction': SectionsIntroduction;
      'sections.process': SectionsProcess;
    }
  }
}
