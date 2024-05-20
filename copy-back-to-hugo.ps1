$target = "C:/Users/xgenx/source/repos/handex.io/"
$source = "C:/Users/xgenx/source/repos/handex-react/"
Copy-Item -Exclude "src/assets/*" -Path "$source/src/*" -Destination "$target/handex.io/assets/ts" -Recurse -Force
Move-Item -Path "$target/handex.io/assets/ts/assets/*" -Destination "$target/handex.io/assets" -Force
Remove-Item -Path "$target/handex.io/assets/ts/assets"
Push-Location $target
git add .
git commit -m "Update from handex-react terminal"
git push
Pop-Location