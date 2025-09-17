{
  pkgs ? import <nixpkgs> { },
}:
# https://nixos.org/manual/nixpkgs/stable/#beam-introduction
# https://github.com/NixOS/nixpkgs/blob/master/pkgs/top-level/beam-packages.nix
# https://medium.com/@ejpcmac/using-nix-in-elixir-projects-ff5300214e70
# https://ejpcmac.net/blog/using-nix-in-elixir-projects/
with pkgs;
let
  nur = pkgs.callPackage (import (
    builtins.fetchGit {
      url = "https://github.com/nix-community/NUR";
    }
  )) { };

  erlang = beam.interpreters.erlang_27;
  elixir = beam.packages.erlang_27.elixir_1_18;

  elixir-ls = beam.packages.erlang_27.elixir-ls;

  # this is how to use a gh version of elixir
  _elixir_main = beam.packages.erlang_27.elixir.overrideAttrs (old: {
    name = "elixir-1.19-pre";
    src = fetchFromGitHub {
      rev = "699bb9112e2430a5f1fd965a2a5a0312844a541f";
      sha256 = "sha256-pdo5t+ZbIZo3287d79U3zqqj46bqXdjpwkvTHllKch0=";
      owner = "elixir-lang";
      repo = "elixir";
    };
  });

  nodejs-pinned = (
    (import (builtins.fetchGit {
      # https://lazamar.co.uk/nix-versions/?channel=nixpkgs-unstable&package=nodejs
      name = "nixpkgs-nodejs-20.18.1"; # name in nix store
      url = "https://github.com/NixOS/nixpkgs/";
      ref = "refs/heads/nixpkgs-unstable";
      rev = "4f0dadbf38ee4cf4cc38cbc232b7708fddf965bc";
    }) { }).nodejs_20
  );

  crushConfig = pkgs.writeText ".crush.json" (
    builtins.toJSON {
      "$schema" = "https://charm.land/crush.json";
      lsp = {
        elixir = {
          command = "elixir-ls";
        };
      };
    }
  );

in
# next-ls =
#   let
#     packages = beam.packagesWith erlang;
#     pname = "next-ls";
#     version = "0.23.0";
#
#     src = fetchFromGitHub {
#       owner = "elixir-tools";
#       repo = "next-ls";
#       rev = "v${version}";
#       hash = "sha256-wTEf0pxVIT7qmPufAN9vGR9rY31kWjNabYZwKe/hkVU=";
#     };
#     mixFodDeps = beamPackages.fetchMixDeps {
#       pname = "${pname}-deps";
#       inherit src version elixir;
#       hash = "sha256-4Rt5Q0fX+fbncvxyXdpIhgEvn9VYX/QDxDdnbanT21Q=";
#       mixEnv = "prod";
#     };
#   in
#   packages.mixRelease {
#     buildInputs = [
#       pkgs.zig_0_11
#       pkgs.xz
#     ];
#     # doesn't work because elixir_make fails with read-only build root
#     inherit
#       erlang
#       elixir
#       src
#       pname
#       version
#       mixFodDeps
#       ;
#     mixEnv = "prod";
#     removeCookie = false;
#     installPhase = ''
#       mix release --no-deps-check --path $out plain
#       echo "$out/bin/plain eval \"System.no_halt(true); Application.ensure_all_started(:next_ls)\" \"\$@\"" > "$out/bin/nextls"
#       chmod +x "$out/bin/nextls"
#     '';
#   };
mkShell {
  # buildInputs = [ pkgs.zig pkgs.xz ];
  packages = [
    erlang
    # elixir_main
    elixir
    elixir-ls
    # next-ls
    postgresql_17
    nodejs-pinned
    nodejs-pinned.pkgs.pnpm
    nodejs-pinned.pkgs.node-gyp
    # for clang-format for protobuf
    clang
    gcc
    autoconf
    automake
    prisma-engines
    # keep in sync with version installed by ci in
    # .github/workflows/satellite_proto.yml
    protobuf_26
    bun
    inotify-tools
    # next-ls
    ngrok
    cloudflared
    flyctl
    varnish
    awscli2
    nginx
    libtool
    pkg-config
    rustfmt
    cargo
    libcgroup
    nur.repos.charmbracelet.crush
    alsa-lib
    alsa-utils
    alsa-tools
    rust-analyzer
    libclang
    libllvm
  ];
  # https://nixos.wiki/wiki/Development_environment_with_nix-shell
  # NIX_ENFORCE_PURITY lets me cc things
  GEMINI_API_KEY = "AIzaSyAXGmw12owFCCwmvBr-RzsE3eUuMb5Px_A";
  LIBCLANG_PATH = "${pkgs.llvmPackages_16.libclang.lib}/lib";

}
