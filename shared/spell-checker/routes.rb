namespace :api do
  namespace :v1 do
    post 'spellcheck', to: 'spellcheck#check'
    get 'spellcheck/languages', to: 'spellcheck#languages'
    get 'spellcheck/health', to: 'spellcheck#health'
  end
end