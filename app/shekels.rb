class Shekels < Lissio::Application
	expose :@page
	expose :refresh

	def initialize
		super

		router.fragment!

		route '/' do
			@page.go :index
		end

		route '/person/:name' do |params|
			@page.go :person, params[:name]
		end

		route '/item/:name' do |params|
			@page.go :item, params[:name]
		end

		@header = Component::Header.new(self)
		@input  = Component::Input.new(self)
		@page   = Component::Page.new(self)

		on :render do
			@header.render
			@input.render
			@page.render
		end
	end

	def refresh
		@router.update
	end

	html do
		div.header!
		div.input!
		div.page!

		div.github! do
			'<a href="https://github.com/meh/shekels"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://s3.amazonaws.com/github/ribbons/forkme_right_white_ffffff.png" alt="Fork me on GitHub"></a>'
		end
	end

	css do
		rule 'body' do
			width 100.%
			height 100.%

			background '#fff'
			color '#222'
			font family: 'Quicksand'
			font size: 22.px

			text align: :center
		end

		rule 'a' do
			font weight: :bold
			color '#222'
			text decoration: :none
		end

		rule '.negative' do
			color '#b94a48'
		end

		rule '.positive' do
			color '#468847'
		end
	end
end
