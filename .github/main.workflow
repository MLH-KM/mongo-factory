workflow "CI" {
  on = "push"
  resolves = ["Run unit tests"]
}

action "Install deps" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "install"
  runs = "npm"
}

action "Run unit tests" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["Install deps"]
  runs = "npm"
  args = "test"
}
