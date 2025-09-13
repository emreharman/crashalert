#!/bin/bash

echo "🔄 Watchman temizleniyor..."
watchman watch-del-all

echo "🧹 node_modules siliniyor..."
rm -rf node_modules

echo "🧹 android build klasörleri siliniyor..."
rm -rf android/app/build
rm -rf android/.cxx
rm -rf android/app/.cxx
rm -rf android/build

echo "📦 yarn install çalıştırılıyor..."
yarn install

echo "🧼 Gradle temizliği yapılıyor..."
cd android && ./gradlew clean && cd ..

echo "🧬 Codegen dosyaları oluşturuluyor..."
./gradlew generateCodegenArtifactsFromSchema

echo "✅ Her şey temizlendi ve tekrar kuruldu."
echo ""
echo "🚀 Artık şu komutla projeyi başlatabilirsin:"
echo "👉 yarn android"