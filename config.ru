#\ -s puma
require 'bundler'
Bundler.require

run Lissio::Server.new {|s|
	s.append_path 'app'
	s.append_path 'css'
	s.append_path 'js'

	s.index = 'index.html.erb'
	s.debug = true
}
