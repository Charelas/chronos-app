const fs = require('fs');
const path = require('path');

const folders = [
  'add_entry',
  'analytics_deep_dive',
  'dashboard',
  'history',
  'notifications',
  'project_details',
  'settings',
  'team_balance',
  'welcome_to_chronos'
];

const sourceDir = path.join(__dirname, '..');
const appDir = path.join(__dirname, 'app');

function convertHtmlToReactNative(html) {
  let bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return '<View><Text>Error parsing</Text></View>';
  let content = bodyMatch[1];
  
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  
  // Specific replacements first
  // icons - extract text inside span
  content = content.replace(/<span[^>]*material-symbols-outlined[^>]*>([\s\S]*?)<\/span>/g, (match, p1) => {
    return `<MaterialIcons name={"${p1.trim().replace(/_/g, '-')}" as any} size={24} color="gray" />`;
  });
  
  // img tag
  content = content.replace(/<img[^>]*src="(.*?)"[^>]*>/g, '<Image source={{uri: "$1"}} className="w-full h-full" />');

  // SVG and script tags, delete
  content = content.replace(/<svg[\s\S]*?<\/svg>/g, '');
  content = content.replace(/<script[\s\S]*?<\/script>/g, '');

  content = content.replace(/class=/g, 'className=');
  // Strip hrefs
  content = content.replace(/ href="[^"]*"/g, '');
  content = content.replace(/ type="[^"]*"/g, '');
  content = content.replace(/ rows="[^"]*"/g, '');
  content = content.replace(/ for="[^"]*"/g, '');
  content = content.replace(/ id="[^"]*"/g, '');
  content = content.replace(/ name="[^"]*"/g, '');

  // Buttons to TouchableOpacity - Wrap content in Text to avoid bare string errors
  content = content.replace(/<button([^>]*)>([\s\S]*?)<\/button>/g, '<TouchableOpacity$1><Text className="text-inherit">$2</Text></TouchableOpacity>');

  // Generic block tags to View
  const blockTags = ['div', 'header', 'footer', 'section', 'article', 'nav', 'aside', 'main'];
  blockTags.forEach(tag => {
    const openRegex = new RegExp(`<${tag}(\\b|>)`, 'g');
    const closeRegex = new RegExp(`</${tag}>`, 'g');
    // Using ScrollView for main is good
    if (tag === 'main') {
      content = content.replace(openRegex, '<ScrollView$1').replace(closeRegex, '</ScrollView>');
    } else {
      content = content.replace(openRegex, '<View$1').replace(closeRegex, '</View>');
    }
  });

  // Inline tags to Text
  const inlineTags = ['span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'label', 'strong', 'b', 'i', 'em'];
  inlineTags.forEach(tag => {
    const openRegex = new RegExp(`<${tag}(\\b|>)`, 'g');
    const closeRegex = new RegExp(`</${tag}>`, 'g');
    content = content.replace(openRegex, '<Text$1').replace(closeRegex, '</Text>');
  });

  // Buttons to TouchableOpacity
  content = content.replace(/<button/g, '<TouchableOpacity').replace(/<\/button>/g, '</TouchableOpacity>');

  // Self closing tags (br, hr, input)
  content = content.replace(/<br\s*\/?>/g, '');
  content = content.replace(/<hr[^>]*>/g, '<View className="h-px bg-gray-200" />');
  content = content.replace(/<input[^>]*>/g, '<View className="h-10 border border-gray-300 rounded" />');

  // Clean styling attributes
  content = content.replace(/ style="[^"]*"/g, '');
  content = content.replace(/ data-[a-zA-Z0-9-]+="[^"]*"/g, '');

  // Quick fix for unmatched tags or simple attributes
  content = content.replace(/ \w+-[\w-]+="[^"]*"/g, ''); 
                   
  return `import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFonts, Manrope_400Regular, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

export default function Screen() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold
  });

  if (!fontsLoaded) return <View><Text>Loading...</Text></View>;

  return (
    <View className="flex-1 bg-surface">
      ${content}
    </View>
  );
}`;
}

folders.forEach(folder => {
  const htmlPath = path.join(sourceDir, folder, 'code.html');
  if (fs.existsSync(htmlPath)) {
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const rnCode = convertHtmlToReactNative(html);
    
    let filename = folder === 'welcome_to_chronos' ? 'index.tsx' : folder + '.tsx';
    
    fs.writeFileSync(path.join(appDir, filename), rnCode);
    console.log('Created ' + filename);
  }
});
