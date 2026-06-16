import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const Typography = StyleSheet.create({
  // Titres de page (ex: "Horaires", "Mon espace")
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  // Titres de section (ex: "Où allons-nous ?", "Mes titres de transport")
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionTitleOnPrimary: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  // Corps principal
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.text,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  // Libellés de liste
  listLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.text,
  },
  listLabelBold: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  // Sous-texte / description
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
  },
  // Bouton
  button: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  // Label tab bar
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
